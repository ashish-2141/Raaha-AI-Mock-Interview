import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { advanceInterview } from "@/lib/interview/graph";
import { loadInterviewState, saveInterviewState } from "@/lib/interview/redis";
import { buildLocalFallbackReply } from "@/lib/voice/protocol";
import { VoiceTurnInputSchema } from "@/lib/voice/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const startedAt = performance.now();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const input = VoiceTurnInputSchema.parse(await request.json());
    const state = await loadInterviewState(input.interviewId);

    if (!state) {
      return NextResponse.json({ error: "Interview session not found." }, { status: 404 });
    }

    const nextState = await advanceInterview({
      ...state,
      lastAnswer: input.transcript,
    });

    await saveInterviewState(input.interviewId, nextState);

    return NextResponse.json({
      interviewId: input.interviewId,
      turnNumber: nextState.turnNumber,
      nextQuestion: nextState.nextQuestion,
      difficultyScore: nextState.difficultyScore,
      followUp: nextState.followUp,
      qualityScore: nextState.qualityScore,
      latencyMs: Math.round(performance.now() - startedAt),
      mode: "adaptive",
      userId: data.user.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Voice turn failed.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
