"use client";

import { useEffect, useState } from "react";

type SkillSummary = {
  branch: string;
  skill: string;
  participantCount: number;
  answers: number;
  averageQualityScore: number;
  weak: boolean;
};

type DashboardSummary = {
  generatedAt: string;
  suppressed: boolean;
  minimumParticipants: number;
  participantCount: number | null;
  sessionCount: number | null;
  completedSessions: number | null;
  submittedAnswers: number | null;
  branches: Array<{
    branch: string;
    participantCount: number;
    sessionCount: number;
    answerCount: number;
    averageQualityScore: number;
    weakSkills: SkillSummary[];
  }>;
  weakSkills: SkillSummary[];
  note: string;
};

const panelStyle: React.CSSProperties = {
  border: "1px solid #d8dee8",
  borderRadius: 12,
  padding: 18,
  background: "#fff",
  minWidth: 0,
};

export default function CollegeDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/college-dashboard/summary", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Unable to load the dashboard.");
        return body as DashboardSummary;
      })
      .then((body) => {
        if (active) setSummary(body);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load the dashboard.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 16px 48px", color: "#172033" }}>
      <header style={{ marginBottom: 24 }}>
        <p style={{ margin: 0, fontSize: 12, letterSpacing: 1.3, fontWeight: 700, color: "#53647b" }}>RAAHA · COLLEGE VIEW</p>
        <h1 style={{ fontSize: "clamp(26px, 4vw, 36px)", margin: "8px 0" }}>Cohort skill insights</h1>
        <p style={{ margin: 0, maxWidth: 760, lineHeight: 1.55, color: "#46546a" }}>
          Aggregate interview feedback by branch and skill. Individual answers and candidate identifiers are not shown.
        </p>
      </header>

      {loading ? <p role="status">Loading cohort summary…</p> : null}
      {error ? (
        <section role="alert" style={{ ...panelStyle, borderColor: "#d97706", color: "#7c2d12" }}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>Dashboard unavailable</h2>
          <p style={{ marginBottom: 0 }}>{error}</p>
          <p style={{ marginBottom: 0, fontSize: 13 }}>Sign in with an authorised TPO account. Access is configured by the server operator.</p>
        </section>
      ) : null}

      {summary ? (
        <>
          <p style={{ margin: "0 0 14px", fontSize: 13, color: "#627087" }}>
            Generated {new Date(summary.generatedAt).toLocaleString()}
          </p>
          {summary.suppressed ? (
            <section style={panelStyle} aria-live="polite">
              <h2 style={{ marginTop: 0, fontSize: 20 }}>Privacy threshold active</h2>
              <p style={{ lineHeight: 1.6 }}>{summary.note}</p>
              <p style={{ marginBottom: 0, color: "#627087", fontSize: 13 }}>
                Branch and skill breakdowns remain hidden until the cohort is large enough.
              </p>
            </section>
          ) : (
            <>
              <section aria-label="Cohort totals" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 24 }}>
                <div style={panelStyle}><p style={{ margin: 0, color: "#627087", fontSize: 13 }}>Consenting participants</p><p style={{ fontSize: 30, margin: "6px 0 0", fontWeight: 700 }}>{summary.participantCount}</p></div>
                <div style={panelStyle}><p style={{ margin: 0, color: "#627087", fontSize: 13 }}>Interview sessions</p><p style={{ fontSize: 30, margin: "6px 0 0", fontWeight: 700 }}>{summary.sessionCount}</p></div>
                <div style={panelStyle}><p style={{ margin: 0, color: "#627087", fontSize: 13 }}>Sessions with answers</p><p style={{ fontSize: 30, margin: "6px 0 0", fontWeight: 700 }}>{summary.completedSessions}</p></div>
                <div style={panelStyle}><p style={{ margin: 0, color: "#627087", fontSize: 13 }}>Answers evaluated</p><p style={{ fontSize: 30, margin: "6px 0 0", fontWeight: 700 }}>{summary.submittedAnswers}</p></div>
              </section>

              <section style={{ ...panelStyle, marginBottom: 20 }}>
                <h2 style={{ marginTop: 0, fontSize: 21 }}>Branch overview</h2>
                {summary.branches.length === 0 ? <p>No branch group has reached the privacy threshold.</p> : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
                      <thead><tr>{["Branch", "Participants", "Sessions", "Answers", "Average score / 5", "Weak skills"].map((heading) => <th key={heading} scope="col" style={{ textAlign: "left", padding: "10px 8px", borderBottom: "1px solid #d8dee8", fontSize: 12, color: "#53647b" }}>{heading}</th>)}</tr></thead>
                      <tbody>{summary.branches.map((branch) => (
                        <tr key={branch.branch}>
                          <td style={{ padding: "12px 8px", borderBottom: "1px solid #edf0f5", fontWeight: 600 }}>{branch.branch}</td>
                          <td style={{ padding: "12px 8px", borderBottom: "1px solid #edf0f5" }}>{branch.participantCount}</td>
                          <td style={{ padding: "12px 8px", borderBottom: "1px solid #edf0f5" }}>{branch.sessionCount}</td>
                          <td style={{ padding: "12px 8px", borderBottom: "1px solid #edf0f5" }}>{branch.answerCount}</td>
                          <td style={{ padding: "12px 8px", borderBottom: "1px solid #edf0f5" }}>{branch.averageQualityScore.toFixed(2)}</td>
                          <td style={{ padding: "12px 8px", borderBottom: "1px solid #edf0f5" }}>{branch.weakSkills.map((skill) => skill.skill).join(", ") || "None identified"}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </section>

              <section style={panelStyle}>
                <h2 style={{ marginTop: 0, fontSize: 21 }}>Skills needing attention</h2>
                {summary.weakSkills.length === 0 ? <p>No skill group met the privacy threshold with an average score of 3/5 or lower.</p> : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}>
                      <thead><tr>{["Branch", "Skill area", "Participants", "Answers", "Average score / 5"].map((heading) => <th key={heading} scope="col" style={{ textAlign: "left", padding: "10px 8px", borderBottom: "1px solid #d8dee8", fontSize: 12, color: "#53647b" }}>{heading}</th>)}</tr></thead>
                      <tbody>{summary.weakSkills.map((skill) => (
                        <tr key={skill.branch + "-" + skill.skill}>
                          <td style={{ padding: "12px 8px", borderBottom: "1px solid #edf0f5" }}>{skill.branch}</td>
                          <td style={{ padding: "12px 8px", borderBottom: "1px solid #edf0f5", fontWeight: 600 }}>{skill.skill}</td>
                          <td style={{ padding: "12px 8px", borderBottom: "1px solid #edf0f5" }}>{skill.participantCount}</td>
                          <td style={{ padding: "12px 8px", borderBottom: "1px solid #edf0f5" }}>{skill.answers}</td>
                          <td style={{ padding: "12px 8px", borderBottom: "1px solid #edf0f5" }}>{skill.averageQualityScore.toFixed(2)}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
          <p style={{ color: "#627087", fontSize: 12, lineHeight: 1.5, marginTop: 18 }}>{summary.note}</p>
        </>
      ) : null}
    </main>
  );
}
