"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";

export default function ResumesPage() {
  const [file,setFile]=useState<File|null>(null);
  const [profile,setProfile]=useState<unknown>(null);
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  function onFileChange(event: ChangeEvent<HTMLInputElement>) { setFile(event.target.files?.[0] ?? null); setProfile(null); setError(""); }
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!file) return; setBusy(true); setError(""); setProfile(null);
    const body=new FormData(); body.append("file",file);
    const response=await fetch("/api/resumes/parse",{method:"POST",body}); const payload=await response.json();
    if(!response.ok) setError(payload.error ?? "Resume processing failed."); else setProfile(payload.profile);
    setBusy(false);
  }
  return <main><h1>Resume parser</h1><p>Upload a PDF and receive a validated candidate profile.</p>
    <form onSubmit={onSubmit}><input type="file" accept="application/pdf" onChange={onFileChange} required />
      <button type="submit" disabled={!file||busy}>{busy?"Parsing...":"Parse resume"}</button></form>
    {error ? <p role="alert">{error}</p> : null}
    {profile ? <pre>{JSON.stringify(profile,null,2)}</pre> : null}</main>;
}