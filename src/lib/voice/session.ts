import { getRedis } from "@/lib/interview/redis";
import type { InterviewState } from "@/lib/interview/graph";

const TTL_SECONDS = 60 * 60 * 24;
const ZERO_BREAKDOWN = { evidence: 0, reasoning: 0, specificity: 0, clarity: 0, total: 0 };

function key(interviewId: string) {
  return `voice-interview:${interviewId}`;
}

export async function saveVoiceSession(
  ownerId: string,
  interviewId: string,
  state: Record<string, unknown>,
) {
  const redis = getRedis();
  if (!redis.isOpen) await redis.connect();

  await redis.hSet(key(interviewId), {
    ownerId,
    state: JSON.stringify(state),
  });
  await redis.expire(key(interviewId), TTL_SECONDS);
}

export async function loadVoiceSession(ownerId: string, interviewId: string) {
  const redis = getRedis();
  if (!redis.isOpen) await redis.connect();

  const [storedOwnerId, value] = await Promise.all([
    redis.hGet(key(interviewId), "ownerId"),
    redis.hGet(key(interviewId), "state"),
  ]);

  if (!value) return null;
  if (storedOwnerId !== ownerId) return { unauthorized: true as const };

  const stored = JSON.parse(value) as Record<string, unknown>;
  // Migrate sessions created before fair scoring was introduced.
  const state = {
    ...stored,
    answerHistory: Array.isArray(stored.answerHistory) ? stored.answerHistory : [],
    lastQuestionAtMs: typeof stored.lastQuestionAtMs === "number" ? stored.lastQuestionAtMs : 0,
    lastResponseDurationMs: typeof stored.lastResponseDurationMs === "number" ? stored.lastResponseDurationMs : 0,
    scoreBreakdown: stored.scoreBreakdown ?? ZERO_BREAKDOWN,
    antiCheatFlags: Array.isArray(stored.antiCheatFlags) ? stored.antiCheatFlags : [],
    reviewRequired: stored.reviewRequired === true,
    evaluationHistory: Array.isArray(stored.evaluationHistory) ? stored.evaluationHistory : [],
  };

  return { unauthorized: false as const, state: state as typeof InterviewState.State };
}
