import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { SANDBOX_POLICY, normalizeError, validateCandidateSource } from "./policy";
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

function buildRunner(challenge: CodingChallenge): string {
  const cases = JSON.stringify(challenge.hiddenCases);
  return (
    "import { pathToFileURL } from \\"node:url\\";\\n" +
    "const cases = " + cases + ";\\n" +
    "const moduleUrl = pathToFileURL(\\"/workspace/solution.mjs\\").href;\\n" +
    "function stable(value) { return JSON.stringify(value); }\\n" +
    "const started = Date.now();\\n" +
    "try {\\n" +
    "  const module = await import(moduleUrl);\\n" +
    "  if (typeof module.twoSum !== \\"function\\") throw new Error(\\"Expected exported twoSum(nums, target) function.\\");\\n" +
    "  let passed = 0; const results = [];\\n" +
    "  for (let index = 0; index < cases.length; index += 1) {\\n" +
    "    const current = cases[index]; const testStarted = Date.now();\\n" +
    "    try {\\n" +
    "      const result = module.twoSum(...current.input);\\n" +
    "      const actual = Array.isArray(result) ? [...result].sort((a, b) => a - b) : result;\\n" +
    "      const expected = Array.isArray(current.expected) ? [...current.expected].sort((a, b) => a - b) : current.expected;\\n" +
    "      const casePassed = stable(actual) === stable(expected); if (casePassed) passed += 1;\\n" +
    "      results.push({ caseNumber: index + 1, passed: casePassed, durationMs: Date.now() - testStarted, ...(casePassed ? {} : { error: \\"Output did not match hidden expectation.\\" }) });\\n" +
    "    } catch (error) { results.push({ caseNumber: index + 1, passed: false, durationMs: Date.now() - testStarted, error: String(error?.message ?? error) }); }\\n" +
    "  }\\n" +
    "  console.log(JSON.stringify({ passed, total: cases.length, cases: results }));\\n" +
    "} catch (error) { console.error(String(error?.message ?? error)); process.exit(2); }\\n"
  );
}

function buildDockerArgs(workdir: string): string[] {
  const image = process.env.RAAHA_SANDBOX_IMAGE ?? "node:24-alpine";
  return [
    "run", "--rm",
    "--network", "none",
    "--memory", SANDBOX_POLICY.memoryMb + "m",
    "--cpus", SANDBOX_POLICY.cpuLimit,
    "--pids-limit", String(SANDBOX_POLICY.pidsLimit),
    "--read-only",
    "--cap-drop", "ALL",
    "--security-opt", "no-new-privileges",
    "--tmpfs", "/tmp:rw,nosuid,nodev,size=32m",
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

export async function executeCodingChallenge(source: string, challenge: CodingChallenge): Promise<SandboxResult> {
  const validationError = validateCandidateSource(source);
  if (validationError) {
    return { status: "rejected", cases: [], durationMs: 0, provider: "docker", isolated: true, networkDisabled: true, review: validationError };
  }

  const workdir = await mkdtemp(path.join(tmpdir(), "raaha-sandbox-"));
  const startedAt = Date.now();

  try {
    await writeFile(path.join(workdir, "solution.mjs"), source, "utf8");
    await writeFile(path.join(workdir, "runner.mjs"), buildRunner(challenge), "utf8");

    const { stdout } = await execFileAsync("docker", buildDockerArgs(workdir), {
      timeout: SANDBOX_POLICY.timeoutMs + 1_000,
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
      review: buildReview(challenge, cases),
    };
  } catch (error) {
    const message = normalizeError(error instanceof Error ? error.message : "Sandbox execution failed.");
    const unavailable = /ENOENT|Cannot connect|daemon|docker|image/i.test(message);
    return {
      status: unavailable ? "unavailable" : "failed",
      cases: [],
      durationMs: Date.now() - startedAt,
      provider: "docker",
      isolated: true,
      networkDisabled: true,
      review: unavailable
        ? "Docker sandbox unavailable in this host. Runtime acceptance requires Docker plus the configured sandbox image."
        : message,
    };
  } finally {
    await rm(workdir, { recursive: true, force: true });
  }
}