import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { fairEvaluateAnswer } from "@/lib/interview/fair-scoring";

const RequestSchema = z.object({
  answer: z.string().max(5000),
  previousAnswers: z.array(z.string().max(5000)).max(50).optional(),
  responseDurationMs: z.number().int().positive().max(300000).optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = RequestSchema.parse(await request.json());
    return NextResponse.json({
      userId: data.user.id,
      ...fairEvaluateAnswer(body),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Evaluation failed.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
