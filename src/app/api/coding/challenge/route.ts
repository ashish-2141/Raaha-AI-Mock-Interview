import { NextResponse } from "next/server";
import { getCodingChallenge, publicCodingChallenge } from "@/lib/coding/challenges";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const challenge = getCodingChallenge(url.searchParams.get("id") ?? "two-sum");
  if (!challenge) return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
  return NextResponse.json(publicCodingChallenge(challenge));
}