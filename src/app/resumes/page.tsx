"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import type { ResumeProfile } from "@/lib/resume/schema";
import { createInterviewResumeContext, RESUME_INTERVIEW_CONTEXT_KEY } from "@/lib/interview/resume-context";

type ParseResponse = {
  profile?: ResumeProfile;
  error?: string;
};

export default function ResumesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [profile, setProfile] = useState<ResumeProfile | null>(null);
  const [role, setRole] = useState("Junior Backend Developer");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    setProfile(null);
    setError("");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;

    setBusy(true);
    setError("");
    setProfile(null);

    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/resumes/parse", { method: "POST", body });
      const payload = (await response.json()) as ParseResponse;
      if (!response.ok || !payload.profile) {
        throw new Error(payload.error ?? "Resume processing failed.");
      }
      setProfile(payload.profile);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Resume processing failed.");
    } finally {
      setBusy(false);
    }
  }

  function continueToInterview() {
    if (!profile) return;
    // Keep only the context needed to personalise questions. Do not copy the
    // candidate's name, CGPA or full resume into browser storage.
    const resumeContext = createInterviewResumeContext(profile, role);
    window.sessionStorage.setItem(RESUME_INTERVIEW_CONTEXT_KEY, JSON.stringify(resumeContext));
    window.location.assign("/voice-interview");
  }

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "32px 20px" }}>
      <p><a href="/">Home</a> · <a href="/voice-interview">Voice interview</a></p>
      <h1>Resume parser</h1>
      <p>Upload a PDF to extract a validated profile and use its projects to personalise interview questions.</p>
      <form onSubmit={onSubmit}>
        <label>
          Resume PDF
          <input
            type="file"
            accept="application/pdf"
            onChange={onFileChange}
            required
            style={{ display: "block", marginTop: 8, marginBottom: 16 }}
          />
        </label>
        <button type="submit" disabled={!file || busy}>
          {busy ? "Parsing..." : "Parse resume"}
        </button>
      </form>
      {error ? <p role="alert">{error}</p> : null}
      {profile ? (
        <section aria-labelledby="profile-heading" style={{ marginTop: 24 }}>
          <h2 id="profile-heading">Parsed profile</h2>
          <p><strong>Branch:</strong> {profile.branch}</p>
          <p><strong>Skills:</strong> {profile.skills.length ? profile.skills.join(", ") : "No skills extracted"}</p>
          {profile.cgpa !== null ? <p><strong>CGPA:</strong> {profile.cgpa}</p> : null}
          <h3>Projects</h3>
          {profile.projects.length ? (
            <ul>
              {profile.projects.map((project, index) => (
                <li key={project.name + "-" + index}>
                  <strong>{project.name}</strong>
                  <p>{project.summary}</p>
                  <p><small>Technology: {project.techStack.join(", ") || "Not specified"}</small></p>
                </li>
              ))}
            </ul>
          ) : <p>No projects were extracted. You can still start a general interview.</p>}
          <label style={{ display: "block", marginTop: 20, maxWidth: 480 }}>
            Target role for this interview
            <input
              value={role}
              onChange={(event) => setRole(event.target.value)}
              maxLength={120}
              required
              style={{ display: "block", width: "100%", boxSizing: "border-box", padding: 10, marginTop: 6 }}
            />
          </label>
          <button type="button" onClick={continueToInterview} style={{ marginTop: 16 }}>
            Continue to personalised interview
          </button>
        </section>
      ) : null}
    </main>
  );
}
