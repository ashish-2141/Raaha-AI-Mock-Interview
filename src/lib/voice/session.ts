import { getRedis } from "@/lib/interview/redis";

const TTL_SECONDS = 60 * 60 * 24;

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

  return { unauthorized: false as const, state: JSON.parse(value) };
}
