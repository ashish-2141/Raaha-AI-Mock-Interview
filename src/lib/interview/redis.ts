import { createClient, type RedisClientType } from "redis";

let client: RedisClientType | null = null;

export function getRedis() {
  if (client) return client;
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is required for persistent interview state.");
  client = createClient({ url }) as RedisClientType;
  client.on("error", (error) => console.error("Redis client error", error));
  return client;
}

export async function saveInterviewState(id: string, state: Record<string, unknown>) {
  const redis = getRedis();
  if (!redis.isOpen) await redis.connect();
  await redis.hSet(`interview:${id}`, { state: JSON.stringify(state) });
  await redis.expire(`interview:${id}`, 60 * 60 * 24);
}

export async function loadInterviewState(id: string) {
  const redis = getRedis();
  if (!redis.isOpen) await redis.connect();
  const value = await redis.hGet(`interview:${id}`, "state");
  return value ? JSON.parse(value) : null;
}