"use client";

import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent } from "react";

type ResumeProfile = {
  fullName: string;
  branch: string;
  cgpa: number | null;
  skills: string[];
  projects: Array<{ name: string; techStack: string[]; summary: string }>;
};

const RESUME_PROFILE_KEY = "raaha.resume.profile";

export default function ResumesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [profile, setProfile] = useState<ResumeProfile | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    window.sessionStorage.removeItem(RESUME_PROFILE_KEY);
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
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Resume processing failed.");
      }
      if (!payload.profile || typeof payload.profile.fullName !== "string" ||
          typeof payload.profile.branch !== "string" || !Array.isArray(payload.profile.projects)) {
        throw new Error("The server returned an invalid resume profile.");
      }

      const parsedProfile = payload.profile as ResumeProfile;
      // Only keep the profile in this tab's session storage. No resume/PDF is stored here.
      window.sessionStorage.setItem(RESUME_PROFILE_KEY, JSON.stringify(parsedProfile));
      setProfile(parsedProfile);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Resume processing failed.");
    } finally {
      setBusy(false);
    }
  }

  function clearProfile() {
    window.sessionStorage.removeItem(RESUME_PROFILE_KEY);
    setProfile(null);
  }

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "32px 20px 48px" }}>
      <p><Link href="/">← Home</Link></p>
      <h1>Resume parser</h1>
      <p>Upload a PDF to extract a validated candidate profile and use it to personalise the next interview. The extracted text is sent to the configured AI provider for processing; do not upload a resume unless you have permission to process its contents.</p>
      <form onSubmit={onSubmit}>
        <label>
          Resume PDF (maximum 5 MB and 10 pages)
          <input type="file" accept="application/pdf" onChange={onFileChange} required />
        </label>
        <button type="submit" disabled={!file || busy} style={{ display: "block", marginTop: 12 }}>
          {busy ? "Parsing..." : "Parse resume"}
        </button>
      </form>

      {error ? <p role="alert">{error}</p> : null}

      {profile ? (
        <section aria-labelledby="profile-heading" style={{ marginTop: 24 }}>
          <h2 id="profile-heading">Validated profile</h2>
          <p><strong>Name:</strong> {profile.fullName}</p>
          <p><strong>Branch:</strong> {profile.branch}</p>
          <p><strong>CGPA:</strong> {profile.cgpa ?? "Not stated"}</p>
          <p><strong>Skills:</strong> {profile.skills.length ? profile.skills.join(", ") : "None extracted"}</p>
          <h3>Projects</h3>
          {profile.projects.length ? profile.projects.map((project, index) => (
            <article key={project.name + index} style={{ border: "1px solid #d8dee8", borderRadius: 8, padding: 12, marginBottom: 10 }}>
              <h4>{project.name}</h4>
              <p>{project.techStack.join(", ") || "No technology stack extracted"}</p>
              <p>{project.summary}</p>
            </article>
          )) : <p>No projects were extracted. You can still start a general interview.</p>}
          <p>The profile is available in this browser tab only and is removed when the tab session ends, or when you clear it here. The PDF itself is not saved in browser storage.</p>
          <p><Link href="/voice-interview">Continue to a personalised mock interview →</Link></p>
          <button type="button" onClick={clearProfile}>Clear saved profile</button>
        </section>
      ) : null}
    </main>
  );
}
