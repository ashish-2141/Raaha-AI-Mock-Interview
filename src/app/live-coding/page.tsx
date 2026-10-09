"use client";

import { useEffect, useState } from "react";

type Challenge = { id: string; title: string; prompt: string; language: string; starterCode: string };
type Result = {
  status: "passed" | "failed" | "rejected" | "unavailable";
  passed: number;
  total: number;
  durationMs: number;
  review: string;
  cases: Array<{ caseNumber: number; passed: boolean; durationMs: number; error?: string }>;
};

export default function LiveCodingPage() {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [source, setSource] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(true);
  const [running, setRunning] = useState(false);
  const [aiReviewConsentAccepted, setAiReviewConsentAccepted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/coding/challenge?id=two-sum")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load challenge.");
        return response.json() as Promise<Challenge>;
      })
      .then((data) => { setChallenge(data); setSource(data.starterCode); })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load challenge."))
      .finally(() => setBusy(false));
  }, []);

  async function run() {
    if (!challenge) return;
    setRunning(true); setResult(null); setError("");
    try {
      const response = await fetch("/api/coding/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge.id,
          language: "javascript",
          source,
          aiReviewConsentAccepted,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Execution failed.");
      setResult(data as Result);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Execution failed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: 32 }}>
      <h1>Live coding round</h1>
      <p>Write the solution and run it against hidden tests. Hidden inputs stay on the server.</p>
      {busy ? <p>Loading challenge...</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      {challenge ? (
        <>
          <h2>{challenge.title}</h2>
          <p>{challenge.prompt}</p>
          <textarea
            aria-label="Code editor"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            rows={20}
            spellCheck={false}
            style={{ width: "100%", marginTop: 12, fontFamily: "monospace", fontSize: 14 }}
          />
          <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 16, lineHeight: 1.5 }}>
            <input
              type="checkbox"
              checked={aiReviewConsentAccepted}
              onChange={(event) => setAiReviewConsentAccepted(event.target.checked)}
              style={{ marginTop: 5 }}
            />
            <span>
              Optional AI code review consent: if enabled by the service operator, my submitted code, public challenge statement, and aggregate pass count may be sent to the configured AI provider for complexity and quality feedback. Hidden test inputs and expected outputs are never sent. This feature is disabled by default.
            </span>
          </label>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 16, lineHeight: 1.5 }}>
            <input
              type="checkbox"
              checked={aiReviewConsentAccepted}
              onChange={(event) => setAiReviewConsentAccepted(event.target.checked)}
              style={{ marginTop: 5 }}
            />
            <span>
              Optional AI code review consent: if enabled by the service operator, my submitted code, public challenge statement, and aggregate pass count may be sent to the configured AI provider for complexity and quality feedback. Hidden test inputs and expected outputs are never sent. This feature is disabled by default.
            </span>
          </label>
          <button type="button" onClick={run} disabled={running || !source.trim()} style={{ marginTop: 12 }}>
            {running ? "Running hidden tests..." : "Run hidden tests"}
          </button>
          {result ? (
            <section aria-live="polite" style={{ marginTop: 24 }}>
              <h2>Result: {result.status}</h2>
              <p>{result.passed}/{result.total} hidden tests passed in {result.durationMs} ms.</p>
              <p>{result.review}</p>
              <ul>
                {result.cases.map((item) => (
                  <li key={item.caseNumber}>
                    Case {item.caseNumber}: {item.passed ? "PASS" : "FAIL"}{item.error ? " — " + item.error : ""}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : null}
    </main>
  );
}