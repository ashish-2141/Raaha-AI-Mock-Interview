export type AntiCheatFlag =
  | "prompt-injection"
  | "answer-leakage-request"
  | "duplicate-answer"
  | "speed-outlier";

export type ScoreBreakdown = {
  evidence: number;
  reasoning: number;
  specificity: number;
  clarity: number;
  total: number;
};

export type AntiCheatAssessment = {
  flags: AntiCheatFlag[];
  reviewRequired: boolean;
  note: string;
};

export type FairEvaluation = {
  qualityScore: number;
  scoreBreakdown: ScoreBreakdown;
  antiCheat: AntiCheatAssessment;
  needsFollowUp: boolean;
  concept: string;
};

const EVIDENCE_MARKERS = [
  "for example",
  "measured",
  "measure",
  "tested",
  "tests",
  "testing",
  "implemented",
  "in production",
  "latency",
  "complexity",
  "result",
  "metric",
  "validation",
  "verified",
  "benchmark",
  "reproduced",
];

const REASONING_MARKERS = [
  "because",
  "therefore",
  "trade-off",
  "tradeoff",
  "however",
  "first",
  "then",
  "if",
  "otherwise",
  "alternatively",
  "compared with",
  "as a result",
];

const SPECIFICITY_MARKERS = [
  "api",
  "apis",
  "database",
  "databases",
  "sql",
  "index",
  "indexes",
  "indexed",
  "cache",
  "caching",
  "redis",
  "spring",
  "docker",
  "http",
  "endpoint",
  "endpoints",
  "queue",
  "thread",
  "threads",
  "lock",
  "transaction",
  "schema",
  "test",
  "tests",
  "integration",
  "validation",
  "latency",
  "postgresql",
];

const STRUCTURE_MARKERS = [
  "first",
  "second",
  "finally",
  "step",
  "then",
  "however",
  "in summary",
  "as a result",
];

const VAGUE_PATTERNS = [
  /\bused it\b/i,
  /\bi know\b/i,
  /\bbasic\b/i,
  /\bnot sure\b/i,
  /\bjust\b/i,
  /\betc\b/i,
];

const PROMPT_INJECTION_PATTERNS = [
  /\bignore (all|any|the) previous instructions?\b/i,
  /\bsystem prompt\b/i,
  /\bdeveloper message\b/i,
  /\breveal (the )?(hidden|correct) answer\b/i,
  /\bshow (me )?(the )?hidden (tests|answer)\b/i,
  /\bbypass (the )?(rules|evaluation|guardrails)\b/i,
];

const ANSWER_LEAKAGE_PATTERNS = [
  /\bgive me (the )?(answer|solution)\b/i,
  /\bwhat is the correct answer\b/i,
  /\btell me the answer\b/i,
  /\bsolve this for me\b/i,
  /\breveal (the )?(hidden|correct) answer\b/i,
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function markerMatches(text: string, marker: string): boolean {
  const phrase = escapeRegExp(marker).replace(/\s+/g, "\\s+");
  return new RegExp(\`(?:^|[^a-z0-9])\${phrase}(?:$|[^a-z0-9])\`, "i").test(text);
}

function countMatches(text: string, markers: string[]): number {
  return markers.reduce((count, marker) => count + (markerMatches(text, marker) ? 1 : 0), 0);
}

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function inferConcept(answer: string): string {
  if (/\b(redis|cache|caching|eviction|ttl)\b/.test(answer)) return "caching";
  if (/\b(sql|index|join|query|postgres|postgresql|database)\b/.test(answer)) return "databases";
  if (/\b(spring|rest|api|http|controller|endpoint)\b/.test(answer)) return "backend";
  if (/\b(thread|lock|concurrent|async|parallel)\b/.test(answer)) return "concurrency";
  if (/\b(docker|container|image|deployment)\b/.test(answer)) return "deployment";
  return "core-engineering";
}

function scoreSignals(answer: string): ScoreBreakdown {
  const normalized = normalize(answer);
  const words = normalized.split(" ").filter(Boolean);

  if (words.length === 0) {
    return { evidence: 0, reasoning: 0, specificity: 0, clarity: 0, total: 0 };
  }

  const evidence = Math.min(5, countMatches(normalized, EVIDENCE_MARKERS));
  const reasoning = Math.min(5, countMatches(normalized, REASONING_MARKERS));
  const specificity = Math.min(5, countMatches(normalized, SPECIFICITY_MARKERS));
  const structure = Math.min(5, countMatches(normalized, STRUCTURE_MARKERS));
  const lengthFloor = words.length >= 14 ? 1 : 0;
  const clarity = Math.min(5, structure + lengthFloor);

  const weighted =
    evidence * 0.3 +
    reasoning * 0.3 +
    specificity * 0.2 +
    clarity * 0.2;

  return {
    evidence,
    reasoning,
    specificity,
    clarity,
    total: Math.round(weighted * 20),
  };
}

export function assessAntiCheat(input: {
  answer: string;
  previousAnswers?: string[];
  responseDurationMs?: number;
}): AntiCheatAssessment {
  const normalized = normalize(input.answer);
  const flags: AntiCheatFlag[] = [];

  if (PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(normalized))) {
    flags.push("prompt-injection");
  }

  if (ANSWER_LEAKAGE_PATTERNS.some((pattern) => pattern.test(normalized))) {
    flags.push("answer-leakage-request");
  }

  const previous = (input.previousAnswers ?? []).map(normalize);
  if (previous.includes(normalized) && normalized.length > 0) {
    flags.push("duplicate-answer");
  }

  const wordCount = normalized.split(" ").filter(Boolean).length;
  if (
    typeof input.responseDurationMs === "number" &&
    input.responseDurationMs > 0 &&
    input.responseDurationMs < 1200 &&
    wordCount >= 30
  ) {
    flags.push("speed-outlier");
  }

  return {
    flags,
    reviewRequired: flags.length > 0,
    note:
      flags.length === 0
        ? "No automated integrity signal detected. This is not proof that an answer is authentic."
        : "Flagged for human review only. Integrity flags do not directly reduce the candidate score.",
  };
}

function qualityScoreFromTotal(total: number, hasAnswer: boolean): number {
  if (!hasAnswer) return 0;
  if (total >= 70) return 5;
  if (total >= 45) return 4;
  if (total >= 30) return 3;
  if (total >= 15) return 2;
  return 1;
}

export function fairEvaluateAnswer(input: {
  answer: string;
  previousAnswers?: string[];
  responseDurationMs?: number;
  difficulty?: number;
}): FairEvaluation {
  const normalized = normalize(input.answer);
  const words = normalized.split(" ").filter(Boolean);
  const hasAnswer = words.length > 0;
  const scoreBreakdown = scoreSignals(input.answer);
  const antiCheat = assessAntiCheat(input);
  const qualityScore = qualityScoreFromTotal(scoreBreakdown.total, hasAnswer);
  const vague = !hasAnswer || words.length < 14 || VAGUE_PATTERNS.some((pattern) => pattern.test(normalized));
  const difficulty = input.difficulty ?? 3;

  return {
    qualityScore,
    scoreBreakdown,
    antiCheat,
    needsFollowUp: hasAnswer && (vague || qualityScore < Math.min(4, difficulty)),
    concept: inferConcept(normalized),
  };
}
