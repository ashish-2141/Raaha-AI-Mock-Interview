export const SANDBOX_POLICY = {
  maxSourceBytes: 20_000,
  timeoutMs: 3_000,
  memoryMb: 256,
  cpuLimit: "0.5",
  pidsLimit: 64,
} as const;

const BLOCKED_TOKENS = [
  "child_process",
  "node:child_process",
  "process.binding",
  "process.dlopen",
  "import fs",
  "from \"fs\"",
  "from 'fs'",
];

export function validateCandidateSource(source: string): string | null {
  const bytes = Buffer.byteLength(source, "utf8");
  if (bytes === 0) return "Source code is empty.";
  if (bytes > SANDBOX_POLICY.maxSourceBytes) {
    return "Source code exceeds the " + SANDBOX_POLICY.maxSourceBytes + "-byte limit.";
  }

  const normalized = source.toLowerCase();
  const blocked = BLOCKED_TOKENS.find((token) => normalized.includes(token.toLowerCase()));
  if (blocked) return "Candidate source contains a blocked token: " + blocked;

  return null;
}

export function normalizeError(message: string): string {
  return message
    .replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 800);
}