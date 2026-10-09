import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractResumePdf } from "@/lib/resume/extract-pdf";
import { parseResumeText } from "@/lib/resume/parse-resume";
import { recordApiMetric } from "@/lib/ops/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const startedAt = performance.now();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    await recordApiMetric("/api/resumes/parse", 401, startedAt);
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      await recordApiMetric("/api/resumes/parse", 400, startedAt);
      return NextResponse.json({ error: "Upload a PDF file in the file field." }, { status: 400 });
    }
    const resumeText = await extractResumePdf(file);
    const profile = await parseResumeText(resumeText);
    await recordApiMetric("/api/resumes/parse", 200, startedAt);
    return NextResponse.json({ profile, meta: { userId: data.user.id, source: "pdf", extractedCharacters: resumeText.length } });
  } catch (error) {
    await recordApiMetric("/api/resumes/parse", 422, startedAt);
    const message = error instanceof Error ? error.message : "Resume processing failed.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
