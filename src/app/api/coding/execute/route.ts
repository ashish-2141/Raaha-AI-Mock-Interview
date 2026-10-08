import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCodingChallenge } from "@/lib/coding/challenges";
import { executeCodingChallenge } from "@/lib/coding/sandbox";
import { CodingExecutionRequestSchema } from "@/lib/coding/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  try {
    const input = CodingExecutionRequestSchema.parse(await request.json());
    const challenge = getCodingChallenge(input.challengeId);
    if (!challenge) return NextResponse.json({ error: "Challenge not found." }, { status: 404 });

    const result = await executeCodingChallenge(input.source, challenge);
    const passed = result.cases.filter((item) => item.passed).length;
    return NextResponse.json({
      challengeId: input.challengeId,
      ...result,
      passed,
      total: challenge.hiddenCases.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to execute coding submission.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}