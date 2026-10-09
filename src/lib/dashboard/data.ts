import { getRedis } from "@/lib/interview/redis";
import {
  buildCollegeDashboardSummary,
  type DashboardEvaluation,
  type DashboardSession,
} from "./aggregate";

const INDEX_TTL_SECONDS = 60 * 60 * 24;

function indexKey(collegeId: string) {
  return `college-interviews:${collegeId}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseEvaluation(value: unknown): DashboardEvaluation | null {
  if (!isRecord(value) || typeof value.concept !== "string" || typeof value.qualityScore !== "number") {
    return null;
  }
  const breakdown = value.scoreBreakdown;
  if (!isRecord(breakdown)) return null;
  const fields = ["evidence", "reasoning", "specificity", "clarity", "total"] as const;
  if (!fields.every((field) => typeof breakdown[field] === "number")) return null;
  return {
    concept: value.concept || "core-engineering",
    qualityScore: value.qualityScore,
    scoreBreakdown: {
      evidence: breakdown.evidence as number,
      reasoning: breakdown.reasoning as number,
      specificity: breakdown.specificity as number,
      clarity: breakdown.clarity as number,
      total: breakdown.total as number,
    },
  };
}

export async function loadCollegeDashboardSummary(collegeId: string) {
  const redis = getRedis();
  if (!redis.isOpen) await redis.connect();

  const interviewIds = await redis.sMembers(indexKey(collegeId));
  const sessions: DashboardSession[] = [];

  for (const interviewId of interviewIds) {
    const [ownerId, serialized] = await Promise.all([
      redis.hGet(`voice-interview:${interviewId}`, "ownerId"),
      redis.hGet(`voice-interview:${interviewId}`, "state"),
    ]);
    if (!ownerId || !serialized) continue;

    try {
      const state: unknown = JSON.parse(serialized);
      if (!isRecord(state)) continue;
      if (state.collegeId !== collegeId || typeof state.consentAcceptedAtMs !== "number") continue;
      const history = Array.isArray(state.evaluationHistory)
        ? state.evaluationHistory.map(parseEvaluation).filter((evaluation): evaluation is DashboardEvaluation => evaluation !== null)
        : [];
      sessions.push({
        ownerId,
        collegeId,
        consentAcceptedAtMs: state.consentAcceptedAtMs,
        branch: typeof state.branch === "string" ? state.branch : "Unspecified",
        turnNumber: typeof state.turnNumber === "number" ? state.turnNumber : 0,
        evaluationHistory: history,
      });
    } catch {
      // Ignore expired or malformed session records. No candidate content is logged.
    }
  }

  return buildCollegeDashboardSummary(sessions);
}

export { INDEX_TTL_SECONDS, indexKey };
