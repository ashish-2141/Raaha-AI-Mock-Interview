import { NextResponse } from "next/server";
import { getRedis } from "@/lib/interview/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const redis = getRedis();
    if (!redis.isOpen) await redis.connect();
    await redis.ping();
    return NextResponse.json({
      status: "ok",
      service: "raaha-ai-mock-interview",
      dependencies: { redis: "ok" },
      timestamp: new Date().toISOString(),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error(JSON.stringify({
      event: "raaha_health_check_failed",
      dependency: "redis",
      timestamp: new Date().toISOString(),
    }));
    return NextResponse.json({
      status: "degraded",
      service: "raaha-ai-mock-interview",
      dependencies: { redis: "unavailable" },
      timestamp: new Date().toISOString(),
    }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
