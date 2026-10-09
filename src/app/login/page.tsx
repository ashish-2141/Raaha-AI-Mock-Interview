"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const supabase = createClient();
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        window.location.href = "/resumes";
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/resumes` },
      });
      if (signUpError) throw signUpError;

      if (data.session) {
        window.location.href = "/resumes";
        return;
      }
      setMessage("Account created. Check your email to confirm the address, then sign in.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  const isSignUp = mode === "signup";

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "32px 20px 48px" }}>
      <h1>Raaha AI Mock Interview</h1>
      <h2>{isSignUp ? "Create an account" : "Sign in"}</h2>
      <p>{isSignUp ? "Create an account to use resume parsing and interview practice." : "Sign in to continue to resume parsing and interview practice."}</p>
      <form onSubmit={onSubmit}>
        <label style={{ display: "block", marginBottom: 12 }}>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required style={{ display: "block", width: "100%", boxSizing: "border-box", padding: 10 }} />
        </label>
        <label style={{ display: "block", marginBottom: 12 }}>
          Password
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete={isSignUp ? "new-password" : "current-password"} minLength={8} required style={{ display: "block", width: "100%", boxSizing: "border-box", padding: 10 }} />
        </label>
        <button type="submit" disabled={busy}>
          {busy ? "Please wait..." : isSignUp ? "Create account" : "Sign in"}
        </button>
      </form>
      {error ? <p role="alert">{error}</p> : null}
      {message ? <p role="status">{message}</p> : null}
      <p style={{ marginTop: 16 }}>
        {isSignUp ? "Already registered? " : "New to Raaha? "}
        <button type="button" onClick={() => { setMode(isSignUp ? "signin" : "signup"); setError(""); setMessage(""); }}>
          {isSignUp ? "Sign in" : "Create an account"}
        </button>
      </p>
      <p><a href="/">← Home</a></p>
    </main>
  );
}
