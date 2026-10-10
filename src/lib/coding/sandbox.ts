import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { SANDBOX_POLICY, normalizeError, validateCandidateSource } from "./policy";
import type { CodingChallenge, HiddenCase } from "./challenges";

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

type CaseExecution = { result: unknown; durationMs: number };

class SandboxExecutionError extends Error {
  readonly status: "failed" | "unavailable";
  readonly timedOut: boolean;

  constructor(message: string, status: "failed" | "unavailable", timedOut = false) {
    super(message);
    this.name = "SandboxExecutionError";
    this.status = status;
    this.timedOut = timedOut;
  }
}

/**
 * One hidden case is supplied to one short-lived container at a time.
 * The expected value and the remaining cases stay in the host process and are
 * never mounted into the candidate execution environment.
 */
function buildRunner(input: unknown[]): string {
  return [
    'import { pathToFileURL } from "node:url";',
    "const input = " + JSON.stringify(input) + ";",
    'const moduleUrl = pathToFileURL("/workspace/solution.mjs").href;',
    "const started = Date.now();",
    "try {",
    "  const module = await import(moduleUrl);",
    '  if (typeof module.twoSum !== "function") throw new Error("Expected exported twoSum(nums, target) function.");',
    "  const result = module.twoSum(...input);",
    '  if (result && typeof result.then === "function") throw new Error("Async solutions are not supported by this challenge.");',
    "  const normalized = Array.isArray(result) ? [...result].sort((a, b) => a - b) : result;",
    '  process.stdout.write(JSON.stringify({ ok: true, result: normalized, durationMs: Date.now() - started }) + "\\n");',
    "} catch (error) {",
    '  process.stderr.write(String(error?.message ?? error).slice(0, 500));',
    "  process.exitCode = 2;",
    "}",
    "",
  ].join("\n");
}

export function buildDockerArgs(workdir: string, cidFile = path.join(workdir, "container.cid")): string[] {
  const image = process.env.RAAHA_SANDBOX_IMAGE ?? "public.ecr.aws/docker/library/node:24-alpine";
  return [
    "run",
    "--rm",
    "--cidfile", cidFile,
    "--stop-timeout", "1",
    "--user", "1000:1000",
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

function isTimeoutError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const value = error as { killed?: boolean; signal?: string; code?: string | number };
  return value.killed === true || value.signal === "SIGTERM" || value.code === "ETIMEDOUT";
}

async function terminateSandbox(cidFile: string): Promise<void> {
  try {
    const containerId = (await readFile(cidFile, "utf8")).trim();
    if (!containerId) return;
    await execFileAsync("docker", ["kill", "--signal=KILL", containerId], {
      timeout: 2_000,
      maxBuffer: 8 * 1024,
    });
  } catch {
    // It may already have exited or the Docker daemon may be unavailable.
  }
}

function stable(value: unknown): string {
  return JSON.stringify(value) ?? "undefined";
}

function normalizeOutput(value: unknown): unknown {
  return Array.isArray(value) ? [...value].sort((a, b) => Number(a) - Number(b)) : value;
}

async function executeIsolatedCase(source: string, testCase: HiddenCase): Promise<CaseExecution> {
  const workdir = await mkdtemp(path.join(tmpdir(), "raaha-sandbox-"));
  const sourcePath = path.join(workdir, "solution.mjs");
  const runnerPath = path.join(workdir, "runner.mjs");
  const cidFile = path.join(workdir, "container.cid");
  const startedAt = Date.now();

  try {
    await writeFile(sourcePath, source, { encoding: "utf8", mode: 0o444 });
    await writeFile(runnerPath, buildRunner(testCase.input), { encoding: "utf8", mode: 0o444 });
    // mkdtemp creates a private 0700 directory; allow only traversal/read access
    // for the non-root runtime user while the bind mount itself remains read-only.
    await chmod(workdir, 0o755);

    const { stdout } = await execFileAsync("docker", buildDockerArgs(workdir, cidFile), {
      timeout: SANDBOX_POLICY.timeoutMs + 1_000,
      maxBuffer: 64 * 1024,
    });

    const parsed = JSON.parse(stdout.trim()) as { ok: boolean; result?: unknown; durationMs?: number };
    if (!parsed.ok || !("result" in parsed)) {
      throw new Error("Sandbox runner did not return a valid result.");
    }
    return {
      result: parsed.result,
      durationMs: Math.max(0, parsed.durationMs ?? Date.now() - startedAt),
    };
  } catch (error) {
    const timedOut = isTimeoutError(error);
    if (timedOut) await terminateSandbox(cidFile);

    const message = timedOut
      ? "Sandbox timed out after " + (SANDBOX_POLICY.timeoutMs + 1_000) + " ms; the container was killed."
      : normalizeError(error instanceof Error ? error.message : "Sandbox execution failed.");
    const unavailable = !timedOut && /ENOENT|Cannot connect to the Docker daemon|Is the docker daemon running|pull access denied|manifest unknown/i.test(message);

    throw new SandboxExecutionError(
      unavailable
        ? "Docker sandbox unavailable. Runtime acceptance requires Docker and the configured sandbox image."
        : message,
      unavailable ? "unavailable" : "failed",
      timedOut,
    );
  } finally {
    // On timeout this removes any process left after the CLI itself is killed.
    await terminateSandbox(cidFile);
    await rm(workdir, { recursive: true, force: true });
  }
}

function buildReview(challenge: CodingChallenge, cases: SandboxCaseResult[]): string {
  const passed = cases.filter((item) => item.passed).length;
  if (cases.some((item) => item.error?.includes("timed out"))) {
    return "A hidden test exceeded the sandbox time limit. Check for infinite loops or excessive work before submitting again.";
  }
  if (passed !== cases.length || cases.length !== challenge.hiddenCases.length) {
    return "The " + challenge.title + " solution did not pass the complete hidden test suite. Fix correctness and edge cases before optimising.";
  }
  return "All hidden tests passed. Explain the O(n) lookup approach and why it avoids nested scans.";
}

export async function executeCodingChallenge(source: string, challenge: CodingChallenge): Promise<SandboxResult> {
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

  const startedAt = Date.now();
  const cases: SandboxCaseResult[] = [];
  let infrastructureUnavailable = false;

  for (let index = 0; index < challenge.hiddenCases.length; index += 1) {
    const testCase = challenge.hiddenCases[index];
    if (!testCase) continue;
    const caseStartedAt = Date.now();

    try {
      const execution = await executeIsolatedCase(source, testCase);
      const passed = stable(normalizeOutput(execution.result)) === stable(normalizeOutput(testCase.expected));
      cases.push({
        caseNumber: index + 1,
        passed,
        durationMs: execution.durationMs || Date.now() - caseStartedAt,
        ...(passed ? {} : { error: "Output did not match hidden expectation." }),
      });
    } catch (error) {
      const failure = error instanceof SandboxExecutionError
        ? error
        : new SandboxExecutionError(normalizeError(error instanceof Error ? error.message : "Sandbox execution failed."), "failed");
      cases.push({
        caseNumber: index + 1,
        passed: false,
        durationMs: Date.now() - caseStartedAt,
        error: failure.message,
      });
      if (failure.status === "unavailable") infrastructureUnavailable = true;
      // Stop after a timeout/infrastructure failure instead of repeatedly
      // starting additional containers for a submission that already failed.
      if (failure.timedOut || failure.status === "unavailable") break;
    }
  }

  const allCasesRan = cases.length === challenge.hiddenCases.length;
  const allCasesPassed = allCasesRan && cases.every((item) => item.passed);

  return {
    status: infrastructureUnavailable ? "unavailable" : allCasesPassed ? "passed" : "failed",
    cases,
    durationMs: Date.now() - startedAt,
    provider: "docker",
    isolated: true,
    networkDisabled: true,
    review: buildReview(challenge, cases),
  };
}
