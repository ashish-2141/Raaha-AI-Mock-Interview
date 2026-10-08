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
};

const EVIDENCE_MARKERS = [
  "for example",
  "measured",
  "tested",
  "implemented",
  "in production",
  "latency",
  "complexity",
  "result",
  "metric",
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
];

const SPECIFICITY_MARKERS = [
  "api",
  "database",
  "sql",
  "index",
  "cache",
  "redis",
  "spring",
  "docker",
  "http",
  "queue",
  "thread",
  "lock",
  "transaction",
  "schema",
  "test",
];

const STRUCTURE_MARKERS = [
  "first",
  "second",
  "finally",
  "step",
  "then",
  "however",
  "in summary",
];

const PROMPT_INJECTION_PATTERNS = [
  /ignore (all|any|the) previous instructions?/i,
  /system prompt/i,
  /developer message/i,
  /reveal (the )?(hidden|correct) answer/i,
  /show (me )?(the )?hidden (tests|answer)/i,
  /bypass (the )?(rules|evaluation|guardrails)/i,
];

const ANSWER_LEAKAGE_PATTERNS = [
  /give me (the )?(answer|solution)/i,
  /what is the correct answer/i,
  /tell me the answer/i,
  /solve this for me/i,
];

function countMatches(text: string, markers: string[]): number {
  return markers.reduce((count, marker) => count + (text.includes(marker) ? 1 : 0), 0);
}

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function scoreSignals(answer: string): ScoreBreakdown {
  const normalized = normalize(answer);
  const words = normalized.split(" ").filter(Boolean);

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
        ? "No automated integrity signal detected."
        : "Flagged for review; integrity flags do not directly reduce the candidate score.",
  };
}

export function fairEvaluateAnswer(input: {
  answer: string;
  previousAnswers?: string[];
  responseDurationMs?: number;
}): FairEvaluation {
  const scoreBreakdown = scoreSignals(input.answer);
  const antiCheat = assessAntiCheat(input);
  const qualityScore = Math.min(5, Math.max(1, Math.round(scoreBreakdown.total / 20)));

  return {
    qualityScore,
    scoreBreakdown,
    antiCheat,
  };
}
