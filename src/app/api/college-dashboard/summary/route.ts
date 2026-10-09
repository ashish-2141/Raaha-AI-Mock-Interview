import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadCollegeDashboardSummary } from "@/lib/dashboard/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAllowedCollegeId(userId: string): string | null {
  const raw = process.env.RAAHA_COLLEGE_DASHBOARD_ACCESS_JSON;
  if (!raw) return null;

  try {
    const access: unknown = JSON.parse(raw);
    if (typeof access !== "object" || access === null || Array.isArray(access)) return null;
    const collegeId = (access as Record<string, unknown>)[userId];
    return typeof collegeId === "string" && collegeId.trim() ? collegeId.trim() : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const collegeId = getAllowedCollegeId(data.user.id);
  if (!collegeId) {
    return NextResponse.json(
      { error: "College dashboard access is not configured for this account." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const summary = await loadCollegeDashboardSummary(collegeId);
    return NextResponse.json(summary, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { error: "Dashboard data is temporarily unavailable. Check Redis connectivity and server logs." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
