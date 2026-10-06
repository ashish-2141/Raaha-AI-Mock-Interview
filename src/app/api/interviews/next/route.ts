import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { advanceInterview } from "@/lib/interview/graph";
import { InterviewInputSchema } from "@/lib/interview/types";
import { buildConversationContext } from "@/lib/interview/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = InterviewInputSchema.parse(await request.json());
    const state = await advanceInterview({
      ...body,
      qualityScore: 0,
      followUp: false,
      nextQuestion: "",
    });

    return NextResponse.json({
      interviewId: body.interviewId,
      turnNumber: state.turnNumber,
      difficultyScore: state.difficultyScore,
      nextQuestion: state.nextQuestion,
      qualityScore: state.qualityScore,
      followUp: state.followUp,
      contextPreview: buildConversationContext(body),
      userId: data.user.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Interview turn failed.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}