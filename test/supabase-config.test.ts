import { afterEach, describe, expect, it } from "vitest";
import { isSupabaseConfigured } from "../src/lib/supabase/config";

const savedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const savedKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

afterEach(() => {
  if (savedUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = savedUrl;
  if (savedKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = savedKey;
});

describe("Supabase environment readiness", () => {
  it("returns false when credentials are blank or missing", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    expect(isSupabaseConfigured()).toBe(false);

    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    expect(isSupabaseConfigured()).toBe(false);
  });

  it("rejects reserved placeholder hosts used by CI", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.example.invalid";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "placeholder-key";
    expect(isSupabaseConfigured()).toBe(false);
  });

  it("accepts an HTTPS project URL with a publishable key", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
    expect(isSupabaseConfigured()).toBe(true);
  });
});
