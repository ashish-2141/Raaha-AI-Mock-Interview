import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { saveInterviewState } from "@/lib/interview/redis";
import { VoiceStartInputSchema } from "@/lib/voice/types";
import { createInitialVoiceTurn } from "@/lib/voice/protocol";

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
    const input = VoiceStartInputSchema.parse(await request.json());
    const state = await createInitialVoiceTurn(input);

    await saveInterviewState(input.interviewId, state);

    return NextResponse.json({
      interviewId: input.interviewId,
      turnNumber: state.turnNumber,
      nextQuestion: state.nextQuestion,
      difficultyScore: state.difficultyScore,
      followUp: state.followUp,
      qualityScore: state.qualityScore,
      latencyMs: Math.round(performance.now() - startedAt),
      mode: "adaptive",
      userId: data.user.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start voice interview.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
