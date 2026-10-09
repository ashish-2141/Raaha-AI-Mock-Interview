import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { VoiceStartInputSchema } from "@/lib/voice/types";
import { createInitialVoiceTurn } from "@/lib/voice/protocol";
import { saveVoiceSession } from "@/lib/voice/session";
import { recordApiMetric } from "@/lib/ops/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function matchesPilotCode(supplied: string, expected: string): boolean {
  const candidate = Buffer.from(supplied, "utf8");
  const configured = Buffer.from(expected, "utf8");
  return candidate.length === configured.length && timingSafeEqual(candidate, configured);
}

export async function POST(request: Request) {
  const startedAt = performance.now();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    await recordApiMetric("/api/interview/voice/start", 401, startedAt);
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const input = VoiceStartInputSchema.parse(await request.json());
    let collegeId: string | null = null;

    if (input.pilotCode) {
      const expectedCode = process.env.RAAHA_PILOT_INVITE_CODE;
      const configuredCollegeId = process.env.RAAHA_PILOT_COLLEGE_ID;
      if (!expectedCode || !configuredCollegeId) {
        await recordApiMetric("/api/interview/voice/start", 503, startedAt);
        return NextResponse.json({ error: "The college pilot is not configured on this deployment." }, { status: 503 });
      }
      if (!matchesPilotCode(input.pilotCode, expectedCode)) {
        await recordApiMetric("/api/interview/voice/start", 403, startedAt);
        return NextResponse.json({ error: "The college pilot code is invalid." }, { status: 403 });
      }
      collegeId = configuredCollegeId;
    }

    const state = await createInitialVoiceTurn(input, {
      collegeId,
      consentAcceptedAtMs: Date.now(),
    });
    await saveVoiceSession(data.user.id, input.interviewId, state);
    await recordApiMetric("/api/interview/voice/start", 200, startedAt);

    return NextResponse.json({
      interviewId: input.interviewId,
      turnNumber: state.turnNumber,
      nextQuestion: state.nextQuestion,
      difficultyScore: state.difficultyScore,
      followUp: state.followUp,
      qualityScore: state.qualityScore,
      latencyMs: Math.round(performance.now() - startedAt),
      mode: "adaptive",
      pilotCohort: collegeId !== null,
      userId: data.user.id,
    });
  } catch (error) {
    await recordApiMetric("/api/interview/voice/start", 422, startedAt);
    const message = error instanceof Error ? error.message : "Unable to start voice interview.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
