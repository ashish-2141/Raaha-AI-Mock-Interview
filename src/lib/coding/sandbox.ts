import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { SANDBOX_POLICY, normalizeError, validateCandidateSource } from "./policy";
import type { CodingChallenge } from "./challenges";
import { generateAiCodeReview } from "./review";

const execFileAsync = promisify(execFile);

export type SandboxCaseResult = {
  caseNumber: number;
  passed: boolean;
  durationMs: number;
  error?: string;
};

export type SandboxResult = {
  status: "passed" | "failed" | "rejected" | "unavailable";
  cases: SandboxCaseResult[];
  durationMs: number;
  provider: "docker";
  isolated: boolean;
  networkDisabled: boolean;
  review: string;
};

type SandboxExecError = Error & {
  code?: string | number;
  killed?: boolean;
  signal?: string;
};

function buildRunner(challenge: CodingChallenge): string {
  const cases = JSON.stringify(challenge.hiddenCases);
  return [
    'import { pathToFileURL } from "node:url";',
    "const cases = " + cases + ";",
    'const moduleUrl = pathToFileURL("/workspace/solution.mjs").href;',
    "function stable(value) { return JSON.stringify(value); }",
    "const started = Date.now();",
    "try {",
    "  const module = await import(moduleUrl);",
    '  if (typeof module.twoSum !== "function") throw new Error("Expected exported twoSum(nums, target) function.");',
    "  let passed = 0; const results = [];",
    "  for (let index = 0; index < cases.length; index += 1) {",
    "    const current = cases[index]; const testStarted = Date.now();",
    "    try {",
    "      const result = module.twoSum(...current.input);",
    "      const actual = Array.isArray(result) ? [...result].sort((a, b) => a - b) : result;",
    "      const expected = Array.isArray(current.expected) ? [...current.expected].sort((a, b) => a - b) : current.expected;",
    "      const casePassed = stable(actual) === stable(expected); if (casePassed) passed += 1;",
    '      results.push({ caseNumber: index + 1, passed: casePassed, durationMs: Date.now() - testStarted, ...(casePassed ? {} : { error: "Output did not match hidden expectation." }) });',
    "    } catch (error) { results.push({ caseNumber: index + 1, passed: false, durationMs: Date.now() - testStarted, error: String(error?.message ?? error) }); }",
    "  }",
    "  console.log(JSON.stringify({ passed, total: cases.length, cases: results }));",
    "} catch (error) { console.error(String(error?.message ?? error)); process.exit(2); }",
    "",
  ].join("\n");
}

function buildDockerCreateArgs(workdir: string, containerName: string): string[] {
  const image = process.env.RAAHA_SANDBOX_IMAGE ?? "public.ecr.aws/docker/library/node:24-alpine";
  return [
    "create",
    "--name", containerName,
    "--init",
    "--network", "none",
    "--memory", SANDBOX_POLICY.memoryMb + "m",
    "--memory-swap", SANDBOX_POLICY.memoryMb + "m",
    "--cpus", SANDBOX_POLICY.cpuLimit,
    "--pids-limit", String(SANDBOX_POLICY.pidsLimit),
    "--ulimit", "nofile=64:64",
    "--read-only",
    "--cap-drop", "ALL",
    "--security-opt", "no-new-privileges=true",
    "--user", "65534:65534",
    "--tmpfs", "/tmp:rw,nosuid,nodev,noexec,size=32m,mode=1777",
    "--mount", "type=bind,src=" + workdir + ",dst=/workspace,readonly",
    "--workdir", "/workspace",
    image,
    "node", "--no-warnings", "/workspace/runner.mjs",
  ];
}

function buildReview(challenge: CodingChallenge, cases: SandboxCaseResult[]): string {
  const passed = cases.filter((item) => item.passed).length;
  if (passed !== cases.length) {
    return "The " + challenge.title + " solution does not pass all hidden tests. Fix correctness and edge cases before optimising.";
  }
  return "All hidden tests passed. Explain the O(n) lookup approach and why it avoids nested scans.";
}

function describeExecutionFailure(error: unknown): { unavailable: boolean; timedOut: boolean; message: string } {
  const typed = error as SandboxExecError;
  const rawMessage = typed instanceof Error ? typed.message : "Sandbox execution failed.";
  const message = normalizeError(rawMessage);
  const code = typed && typeof typed.code !== "undefined" ? String(typed.code) : "";
  const timedOut = code === "ETIMEDOUT" || typed?.killed === true || /timed out|time limit exceeded/i.test(rawMessage);
  const unavailable =
    code === "ENOENT" ||
    /cannot connect to the Docker daemon|error during connect|daemon is not running|no such image|pull access denied|manifest unknown|failed to resolve reference|toomanyrequests|429 too many requests/i.test(rawMessage);
  return { unavailable, timedOut, message };
}

export async function executeCodingChallenge(
  source: string,
  challenge: CodingChallenge,
  options: { allowAiReview?: boolean } = {},
): Promise<SandboxResult> {
  const validationError = validateCandidateSource(source);
  if (validationError) {
    return {
      status: "rejected",
      cases: [],
      durationMs: 0,
      provider: "docker",
      isolated: true,
      networkDisabled: true,
      review: validationError,
    };
  }

  const workdir = await mkdtemp(path.join(tmpdir(), "raaha-sandbox-"));
  const startedAt = Date.now();
  const containerName = "raaha-sandbox-" + randomUUID();
  let containerId: string | null = null;

  try {
    // The sandbox runs as a non-root user, so the mounted source files must be readable.
    await chmod(workdir, 0o755);
    await writeFile(path.join(workdir, "solution.mjs"), source, { encoding: "utf8", mode: 0o644 });
    await writeFile(path.join(workdir, "runner.mjs"), buildRunner(challenge), { encoding: "utf8", mode: 0o644 });

    const created = await execFileAsync("docker", buildDockerCreateArgs(workdir, containerName), {
      timeout: 30_000,
      maxBuffer: 64 * 1024,
    });
    containerId = created.stdout.trim();
    if (!containerId) throw new Error("Docker did not return a sandbox container ID.");

    // Attach timeout applies to the client command; finally always force-removes the
    // named container so an infinite loop cannot keep running after the request ends.
    const { stdout } = await execFileAsync("docker", ["start", "--attach", containerId], {
      timeout: SANDBOX_POLICY.timeoutMs + 2_000,
      maxBuffer: 64 * 1024,
    });

    const parsed = JSON.parse(stdout.trim()) as { cases: SandboxCaseResult[] };
    const cases = parsed.cases;
    const passed = cases.filter((item) => item.passed).length;

    return {
      status: passed === cases.length ? "passed" : "failed",
      cases,
      durationMs: Date.now() - startedAt,
      provider: "docker",
      isolated: true,
      networkDisabled: true,
      review: await generateAiCodeReview({
        challengeTitle: challenge.title,
        challengePrompt: challenge.prompt,
        source,
        passedCases: passed,
        totalCases: challenge.hiddenCases.length,
        fallbackReview: buildReview(challenge, cases),
      }, options.allowAiReview === true),
    };
  } catch (error) {
    const failure = describeExecutionFailure(error);
    return {
      status: failure.unavailable ? "unavailable" : "failed",
      cases: [],
      durationMs: Date.now() - startedAt,
      provider: "docker",
      isolated: true,
      networkDisabled: true,
      review: failure.timedOut
        ? "Execution exceeded the time limit. The sandbox container is forcibly removed."
        : failure.unavailable
          ? "Docker sandbox unavailable in this host or its sandbox image could not be loaded. Runtime acceptance requires Docker plus the configured sandbox image."
          : failure.message,
    };
  } finally {
    if (containerId) {
      try {
        await execFileAsync("docker", ["rm", "--force", containerId], { timeout: 5_000, maxBuffer: 16 * 1024 });
      } catch {
        // Do not include candidate source or container output in logs. Docker cleanup is best-effort.
      }
    }
    await rm(workdir, { recursive: true, force: true });
  }
}
