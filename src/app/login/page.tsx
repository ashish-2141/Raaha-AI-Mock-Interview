"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const { error: signInError } = await createClient().auth.signInWithPassword({ email, password });
    if (signInError) { setError(signInError.message); setBusy(false); return; }
    window.location.href="/resumes";
  }
  return <main><h1>Raaha Mock Interview</h1><h2>Sign in</h2><form onSubmit={onSubmit}>
    <label>Email<input value={email} onChange={e=>setEmail(e.target.value)} type="email" required /></label>
    <label>Password<input value={password} onChange={e=>setPassword(e.target.value)} type="password" required /></label>
    <button type="submit" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
  </form>{error ? <p role="alert">{error}</p> : null}</main>;
}