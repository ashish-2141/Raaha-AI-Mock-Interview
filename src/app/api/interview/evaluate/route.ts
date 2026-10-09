import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { advanceInterview } from "@/lib/interview/graph";
import { loadVoiceSession, saveVoiceSession } from "@/lib/voice/session";
import { recordApiMetric } from "@/lib/ops/metrics";

const RequestSchema = z.object({
  interviewId: z.uuid(),
  answer: z.string().trim().min(1).max(5000),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const startedAt = performance.now();
  if (!isSupabaseConfigured()) {
    await recordApiMetric("/api/interview/evaluate", 503, startedAt);
    return NextResponse.json(
      { error: "Supabase authentication is not configured on this deployment." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    await recordApiMetric("/api/interview/evaluate", 401, startedAt);
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = RequestSchema.parse(await request.json());
    const session = await loadVoiceSession(data.user.id, body.interviewId);

    if (!session) {
      await recordApiMetric("/api/interview/evaluate", 404, startedAt);
      return NextResponse.json({ error: "Interview session not found." }, { status: 404 });
    }
    if (session.unauthorized) {
      await recordApiMetric("/api/interview/evaluate", 403, startedAt);
      return NextResponse.json({ error: "Interview session is not owned by this account." }, { status: 403 });
    }

    const nextState = await advanceInterview({
      ...session.state,
      lastAnswer: body.answer,
    });
    await saveVoiceSession(data.user.id, body.interviewId, nextState);
    await recordApiMetric("/api/interview/evaluate", 200, startedAt);

    return NextResponse.json({
      interviewId: body.interviewId,
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
    await recordApiMetric("/api/interview/evaluate", 422, startedAt);
    const message = error instanceof Error ? error.message : "Evaluation failed.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
