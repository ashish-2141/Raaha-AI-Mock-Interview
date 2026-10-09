import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { SANDBOX_POLICY, normalizeError, validateCandidateSource } from "./policy";
import { generateAiCodeReview } from "./review";
import type { CodingChallenge } from "./challenges";

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

/**
 * Runs one test input inside the isolated container. Expected outputs and the hidden
 * case list deliberately stay in the web-server process and are never mounted or
 * passed into the candidate container. Only the current input is visible to code.
 */
function buildCaseRunner(): string {
  return [
    'import { pathToFileURL } from "node:url";',
    'const rawInput = process.env.RAAHA_CASE_INPUT;',
    'if (!rawInput) throw new Error("Test input is missing.");',
    'const input = JSON.parse(rawInput);',
    'const solution = await import(pathToFileURL("/workspace/solution.mjs").href);',
    'if (typeof solution.twoSum !== "function") throw new Error("Expected exported twoSum(nums, target) function.");',
    'const result = solution.twoSum(...input);',
    'console.log(JSON.stringify({ result }));',
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
    "node", "-e", "setInterval(() => {}, 1000)",
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
  const timedOut =
    code === "ETIMEDOUT" ||
    typed?.killed === true ||
    /timed out|time limit exceeded/i.test(rawMessage);
  const unavailable =
    code === "ENOENT" ||
    /cannot connect to the Docker daemon|error during connect|daemon is not running|no such image|pull access denied|manifest unknown|failed to resolve reference|toomanyrequests|429 too many requests/i.test(rawMessage);
  return { unavailable, timedOut, message };
}

function normalizeActual(value: unknown): unknown {
  return Array.isArray(value) ? [...value].sort((a, b) => Number(a) - Number(b)) : value;
}

function stable(value: unknown): string {
  return JSON.stringify(value);
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
  const cases: SandboxCaseResult[] = [];
  let timedOut = false;

  try {
    // Only candidate source is mounted. Hidden case inputs/expected outputs remain
    // in this process and are checked here, outside the candidate's container.
    await chmod(workdir, 0o755);
    await writeFile(path.join(workdir, "solution.mjs"), source, { encoding: "utf8", mode: 0o644 });

    const created = await execFileAsync("docker", buildDockerCreateArgs(workdir, containerName), {
      timeout: 30_000,
      maxBuffer: 64 * 1024,
    });
    containerId = created.stdout.trim();
    if (!containerId) throw new Error("Docker did not return a sandbox container ID.");

    await execFileAsync("docker", ["start", "--detach", containerId], {
      timeout: 10_000,
      maxBuffer: 16 * 1024,
    });

    const runner = buildCaseRunner();
    for (let index = 0; index < challenge.hiddenCases.length; index += 1) {
      const current = challenge.hiddenCases[index];
      if (!current) continue;
      const caseStartedAt = Date.now();

      try {
        const { stdout } = await execFileAsync("docker", [
          "exec",
          "--user", "65534:65534",
          "--env", "RAAHA_CASE_INPUT=" + JSON.stringify(current.input),
          containerId,
          "node", "--no-warnings", "--input-type=module", "-e", runner,
        ], {
          timeout: SANDBOX_POLICY.timeoutMs + 1_000,
          maxBuffer: 64 * 1024,
        });

        const outputLine = stdout.trim().split(/\r?\n/).at(-1);
        if (!outputLine) throw new Error("Sandbox returned no result.");
        const payload = JSON.parse(outputLine) as { result?: unknown };
        if (!Object.prototype.hasOwnProperty.call(payload, "result")) {
          throw new Error("Sandbox returned an invalid result.");
        }

        const passed = stable(normalizeActual(payload.result)) === stable(normalizeActual(current.expected));
        cases.push({
          caseNumber: index + 1,
          passed,
          durationMs: Date.now() - caseStartedAt,
          ...(passed ? {} : { error: "Output did not match hidden expectation." }),
        });
      } catch (error) {
        const failure = describeExecutionFailure(error);
        if (failure.timedOut) {
          timedOut = true;
          cases.push({
            caseNumber: index + 1,
            passed: false,
            durationMs: Date.now() - caseStartedAt,
            error: "Execution exceeded the time limit.",
          });
          break;
        }
        cases.push({
          caseNumber: index + 1,
          passed: false,
          durationMs: Date.now() - caseStartedAt,
          error: failure.message,
        });
        if (failure.unavailable) throw error;
      }
    }

    const passed = cases.filter((item) => item.passed).length;
    const allCasesCovered = cases.length === challenge.hiddenCases.length;
    const status = !timedOut && allCasesCovered && passed === challenge.hiddenCases.length ? "passed" : "failed";
    const fallbackReview = timedOut
      ? "Execution exceeded the time limit. The sandbox container is forcibly removed."
      : buildReview(challenge, cases);
    const review = timedOut
      ? fallbackReview
      : await generateAiCodeReview({
        challengeTitle: challenge.title,
        challengePrompt: challenge.prompt,
        source,
        passedCases: passed,
        totalCases: challenge.hiddenCases.length,
        fallbackReview,
      }, options.allowAiReview === true);

    return {
      status,
      cases,
      durationMs: Date.now() - startedAt,
      provider: "docker",
      isolated: true,
      networkDisabled: true,
      review,
    };
  } catch (error) {
    const failure = describeExecutionFailure(error);
    return {
      status: failure.unavailable ? "unavailable" : "failed",
      cases,
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
        // Do not include candidate source or container output in logs. Cleanup is best-effort.
      }
    }
    await rm(workdir, { recursive: true, force: true });
  }
}
