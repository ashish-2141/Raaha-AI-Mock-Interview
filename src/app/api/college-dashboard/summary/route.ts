import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { loadCollegeDashboardSummary } from "@/lib/dashboard/data";
import { recordApiMetric } from "@/lib/ops/metrics";

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
  const startedAt = performance.now();
  if (!isSupabaseConfigured()) {
    await recordApiMetric("/api/college-dashboard/summary", 503, startedAt);
    return NextResponse.json(
      { error: "Supabase authentication is not configured on this deployment." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    await recordApiMetric("/api/college-dashboard/summary", 401, startedAt);
    return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const collegeId = getAllowedCollegeId(data.user.id);
  if (!collegeId) {
    await recordApiMetric("/api/college-dashboard/summary", 403, startedAt);
    return NextResponse.json(
      { error: "College dashboard access is not configured for this account." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const summary = await loadCollegeDashboardSummary(collegeId);
    await recordApiMetric("/api/college-dashboard/summary", 200, startedAt);
    return NextResponse.json(summary, { headers: { "Cache-Control": "no-store" } });
  } catch {
    await recordApiMetric("/api/college-dashboard/summary", 503, startedAt);
    return NextResponse.json(
      { error: "Dashboard data is temporarily unavailable. Check Redis connectivity and server logs." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
