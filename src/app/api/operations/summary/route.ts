import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getOperationsSummary } from "@/lib/ops/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isOperationsAdmin(userId: string): boolean {
  const allowed = (process.env.RAAHA_OPERATIONS_ADMIN_USER_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return allowed.includes(userId);
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase authentication is not configured on this deployment." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  if (!isOperationsAdmin(data.user.id)) {
    return NextResponse.json({ error: "Operations access is not configured for this account." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  try {
    return NextResponse.json(await getOperationsSummary(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Operational metrics are temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
