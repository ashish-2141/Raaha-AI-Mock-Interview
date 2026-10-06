import { z } from "zod";

export const EvaluationSchema = z.object({
  qualityScore: z.number().int().min(1).max(5),
  isVague: z.boolean(),
  needsFollowUp: z.boolean(),
  concept: z.string().min(1),
  evidence: z.string().min(1),
});
export type Evaluation = z.infer<typeof EvaluationSchema>;

const WEAK_PATTERNS = [
  "used it",
  "i know",
  "basic",
  "not sure",
  "just",
  "etc",
];

export function evaluateAnswer(answer: string, difficulty: number): Evaluation {
  const normalized = answer.trim().toLowerCase();
  const words = normalized.split(/\s+/).filter(Boolean);
  const vaguePattern = WEAK_PATTERNS.some((item) => normalized.includes(item));
  const tooShort = words.length < 14;
  const hasEvidence = /because|for example|trade[- ]off|measured|tested|implemented|latency|complexity/.test(normalized);
  const qualityScore = Math.min(
    5,
    Math.max(1, (tooShort ? 1 : 2) + (hasEvidence ? 2 : 0) + (!vaguePattern ? 1 : 0)),
  );

  return {
    qualityScore,
    isVague: tooShort || vaguePattern,
    needsFollowUp: tooShort || vaguePattern || qualityScore < Math.min(4, difficulty),
    concept: inferConcept(normalized),
    evidence: hasEvidence
      ? "Answer includes a concrete implementation, measurement, trade-off or example."
      : "Answer lacks a concrete example, measurement, trade-off or implementation detail.",
  };
}

function inferConcept(answer: string): string {
  if (/redis|cache|eviction|ttl/.test(answer)) return "caching";
  if (/sql|index|join|query|postgres/.test(answer)) return "databases";
  if (/spring|rest|api|http|controller/.test(answer)) return "backend";
  if (/thread|lock|concurrent|async/.test(answer)) return "concurrency";
  if (/docker|container|image/.test(answer)) return "deployment";
  return "core-engineering";
}