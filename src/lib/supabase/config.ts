export function isSupabaseConfigured(): boolean {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!rawUrl || !publishableKey) return false;

  try {
    const url = new URL(rawUrl);
    const supportedProtocol = url.protocol === "https:" || url.protocol === "http:";
    // Reserved .invalid hosts are deliberately used by CI and must never be
    // treated as real auth configuration.
    return supportedProtocol && !url.hostname.toLowerCase().endsWith(".invalid");
  } catch {
    return false;
  }
}
