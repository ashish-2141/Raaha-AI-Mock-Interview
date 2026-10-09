import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { advanceInterview } from "@/lib/interview/graph";
import { buildLocalFallbackReply } from "@/lib/voice/protocol";
import { loadVoiceSession, saveVoiceSession } from "@/lib/voice/session";
import { VoiceTurnInputSchema } from "@/lib/voice/types";
import { recordApiMetric } from "@/lib/ops/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const startedAt = performance.now();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    await recordApiMetric("/api/interview/voice/turn", 401, startedAt);
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const input = VoiceTurnInputSchema.parse(await request.json());
    const session = await loadVoiceSession(data.user.id, input.interviewId);

    if (!session) {
      await recordApiMetric("/api/interview/voice/turn", 404, startedAt);
      return NextResponse.json({ error: "Interview session not found." }, { status: 404 });
    }
    if (session.unauthorized) {
      await recordApiMetric("/api/interview/voice/turn", 403, startedAt);
      return NextResponse.json({ error: "Interview session is not owned by this account." }, { status: 403 });
    }

    const nextState = await advanceInterview({
      ...session.state,
      lastAnswer: input.transcript,
    });

    await saveVoiceSession(data.user.id, input.interviewId, nextState);
    await recordApiMetric("/api/interview/voice/turn", 200, startedAt);

    return NextResponse.json({
      interviewId: input.interviewId,
      turnNumber: nextState.turnNumber,
      nextQuestion: nextState.nextQuestion,
      difficultyScore: nextState.difficultyScore,
      followUp: nextState.followUp,
      qualityScore: nextState.qualityScore,
      scoreBreakdown: nextState.scoreBreakdown,
      antiCheat: {
        flags: nextState.antiCheatFlags,
        reviewRequired: nextState.reviewRequired,
        note: nextState.reviewRequired
          ? "Flagged for human review only. Integrity flags do not directly reduce the candidate score."
          : "No automated integrity signal detected. This is not proof that an answer is authentic.",
      },
      latencyMs: Math.round(performance.now() - startedAt),
      mode: "adaptive",
      userId: data.user.id,
    });
  } catch (error) {
    await recordApiMetric("/api/interview/voice/turn", 422, startedAt);
    const fallback = buildLocalFallbackReply("voice interview", "general");
    const message = error instanceof Error ? error.message : fallback.nextQuestion;
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
