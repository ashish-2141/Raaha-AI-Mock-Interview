"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionEventLike = Event & {
  results: {
    length: number;
    [index: number]: { [index: number]: { transcript: string } };
  };
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type VoiceWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

type VoicePayload = {
  nextQuestion: string;
  turnNumber: number;
  difficultyScore: number;
  followUp: boolean;
  qualityScore: number;
  latencyMs: number;
  mode: "adaptive" | "fallback";
  interviewId: string;
  pilotCohort?: boolean;
};

const INTERVIEW_ID_STORAGE = "raaha.voice.interviewId";
const RESUME_CONTEXT_KEY = "raaha.interview.resumeContext";

type InterviewProject = { name: string; techStack: string[]; summary: string };
type InterviewResumeContext = {
  branch: string;
  role: string;
  resumeProjects: InterviewProject[];
};

const BRANCH_OPTIONS = [
  ["CSE", "Computer Science (CSE)"],
  ["IT", "Information Technology (IT)"],
  ["ECE", "Electronics and Communication (ECE)"],
  ["EEE", "Electrical and Electronics (EEE)"],
  ["MECH", "Mechanical Engineering"],
  ["CIVIL", "Civil Engineering"],
  ["AI_ML", "AI / Machine Learning"],
  ["DATA_SCIENCE", "Data Science"],
  ["CYBERSECURITY", "Cybersecurity"],
  ["OTHER", "Other / not specified"],
] as const;

function readResumeContext(): InterviewResumeContext | null {
  try {
    const raw = window.sessionStorage.getItem(RESUME_CONTEXT_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const candidate = value as Record<string, unknown>;
    if (typeof candidate.branch !== "string" || typeof candidate.role !== "string") return null;
    if (!Array.isArray(candidate.resumeProjects)) return null;
    const resumeProjects = candidate.resumeProjects.filter((project): project is InterviewProject => {
      if (!project || typeof project !== "object") return false;
      const item = project as Record<string, unknown>;
      return typeof item.name === "string"
        && typeof item.summary === "string"
        && Array.isArray(item.techStack)
        && item.techStack.every((skill) => typeof skill === "string");
    }).slice(0, 15);
    return { branch: candidate.branch, role: candidate.role, resumeProjects };
  } catch {
    return null;
  }
}

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  const voiceWindow = window as VoiceWindow;
  return voiceWindow.SpeechRecognition ?? voiceWindow.webkitSpeechRecognition ?? null;
}

function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

export default function VoiceInterviewPage() {
  const [interviewId, setInterviewId] = useState("");
  const [question, setQuestion] = useState("Press start to begin the voice interview.");
  const [transcript, setTranscript] = useState("");
  const [lastReply, setLastReply] = useState("");
  const [status, setStatus] = useState<"idle" | "starting" | "listening" | "thinking" | "error">("idle");
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState(3);
  const [branch, setBranch] = useState("CSE");
  const [role, setRole] = useState("Junior Backend Developer");
  const [resumeProjects, setResumeProjects] = useState<InterviewProject[]>([]);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [pilotCode, setPilotCode] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(INTERVIEW_ID_STORAGE);
    if (stored) setInterviewId(stored);
    const resumeContext = readResumeContext();
    if (resumeContext) {
      setBranch(resumeContext.branch);
      setRole(resumeContext.role);
      setResumeProjects(resumeContext.resumeProjects);
    }
    return () => {
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const startListening = useCallback(() => {
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setStatus("error");
      setLastReply("Voice input is unavailable in this browser. Use the text box below.");
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";
    recognition.onresult = (event) => {
      const spoken = Array.from({ length: event.results.length }, (_, index) =>
        event.results[index]?.[0]?.transcript ?? "",
      ).join(" ").trim();

      if (spoken) {
        setTranscript(spoken);
        void submitTurn(spoken);
      }
    };
    recognition.onerror = () => {
      setStatus("error");
      setLastReply("Voice input failed. You can retry or use the text fallback.");
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      if (startedRef.current) setStatus("idle");
    };

    recognitionRef.current = recognition;
    setStatus("listening");
    recognition.start();
  }, []);

  const submitTurn = useCallback(async (answer: string) => {
    if (!interviewId || !answer.trim()) return;
    setStatus("thinking");
    const startedAt = performance.now();

    try {
      const response = await fetch("/api/interview/voice/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId, transcript: answer }),
      });

      if (!response.ok) {
        throw new Error("Voice turn request failed.");
      }

      const payload = (await response.json()) as VoicePayload;
      const roundLatency = Math.round(performance.now() - startedAt);
      setQuestion(payload.nextQuestion);
      setLastReply(payload.qualityScore > 0
        ? `Answer score: ${payload.qualityScore}/5. ${payload.followUp ? "A follow-up question was selected." : "Next question selected."}`
        : "Next question selected.");
      setDifficulty(payload.difficultyScore);
      setLatencyMs(payload.latencyMs || roundLatency);
      setStatus("idle");
      speak(payload.nextQuestion);
    } catch {
      const fallback = "Network is slow. Continue safely with the text question: explain how you would test the answer you just gave.";
      setLastReply("Offline-safe fallback used.");
      setQuestion(fallback);
      setLatencyMs(Math.round(performance.now() - startedAt));
      setStatus("idle");
      speak(fallback);
    }
  }, [interviewId]);

  async function startInterview() {
    if (!consentAccepted) {
      setStatus("error");
      setLastReply("Please read and accept the consent notice before starting.");
      return;
    }

    setStatus("starting");
    try {
      const id = interviewId || crypto.randomUUID();
      const response = await fetch("/api/interview/voice/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId: id,
          branch,
          role: role.trim(),
          difficultyScore: 3,
          resumeProjects,
          consentAccepted: true,
          pilotCode: pilotCode.trim() || undefined,
        }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Unable to start.");
      const payload = body as VoicePayload;
      setInterviewId(id);
      window.localStorage.setItem(INTERVIEW_ID_STORAGE, id);
      setQuestion(payload.nextQuestion);
      setDifficulty(payload.difficultyScore);
      setLatencyMs(payload.latencyMs);
      setLastReply(payload.pilotCohort
        ? "Consent recorded. This session is included in the configured college pilot cohort."
        : "Consent recorded. This session is not assigned to a college pilot cohort.");
      setStatus("idle");
      speak(payload.nextQuestion);
      startedRef.current = true;
    } catch (reason) {
      setStatus("error");
      setLastReply(reason instanceof Error ? reason.message : "Could not start the interview. Check authentication and server configuration.");
    }
  }

  function interrupt() {
    window.speechSynthesis?.cancel();
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setStatus("idle");
    setLastReply("Speech interrupted. Listening is ready.");
  }

  function submitText() {
    void submitTurn(transcript);
  }

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px 48px" }}>
      <h1>Real-time voice interview</h1>
      <p>Speak your answer, hear the next question, or use the text fallback when voice is unavailable.</p>
      <p><a href="/">Home</a> · <a href="/resumes">Parse a resume</a> · <a href="/live-coding">Live coding</a></p>

      <section aria-label="Interview setup" style={{ border: "1px solid #d8dee8", borderRadius: 12, padding: 16, marginTop: 20 }}>
        <h2>Interview setup</h2>
        <label style={{ display: "block", marginTop: 10 }}>
          B.Tech branch
          <select value={branch} onChange={(event) => setBranch(event.target.value)} style={{ display: "block", width: "100%", maxWidth: 480, padding: 10, marginTop: 6 }}>
            {BRANCH_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label style={{ display: "block", marginTop: 12 }}>
          Target role
          <input value={role} onChange={(event) => setRole(event.target.value)} maxLength={120} required style={{ display: "block", width: "100%", maxWidth: 480, boxSizing: "border-box", padding: 10, marginTop: 6 }} />
        </label>
        {resumeProjects.length ? (
          <div style={{ marginTop: 12 }}>
            <strong>Resume projects used for personalisation</strong>
            <ul>{resumeProjects.map((project, index) => <li key={project.name + "-" + index}>{project.name} · {project.techStack.join(", ")}</li>)}</ul>
          </div>
        ) : <p style={{ marginTop: 12 }}>No resume projects attached. <a href="/resumes">Parse a resume</a> first to personalise the first question.</p>}
      </section>

      <section aria-label="Consent and pilot settings" style={{ border: "1px solid #d8dee8", borderRadius: 12, padding: 16, marginTop: 20 }}>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, lineHeight: 1.5 }}>
          <input
            type="checkbox"
            checked={consentAccepted}
            onChange={(event) => setConsentAccepted(event.target.checked)}
            style={{ marginTop: 5 }}
          />
          <span>
            I consent to processing my interview transcript and scores for feedback. Session data is stored temporarily and expires after 24 hours of inactivity. If I use a college pilot code, my session may contribute to aggregate branch and skill insights. The college dashboard does not show my individual answers or identity.
          </span>
        </label>
        <label style={{ display: "block", marginTop: 14 }}>
          College pilot code (optional)
          <input
            value={pilotCode}
            onChange={(event) => setPilotCode(event.target.value)}
            autoComplete="off"
            maxLength={128}
            placeholder="Enter the code supplied by your college"
            style={{ display: "block", width: "100%", boxSizing: "border-box", padding: 10, marginTop: 6 }}
          />
        </label>
      </section>

      <section aria-live="polite" style={{ marginTop: 24 }}>
        <strong>Question</strong>
        <p>{question}</p>
        <p>Difficulty: {difficulty}/5</p>
        {latencyMs !== null ? <p>Last response: {latencyMs} ms</p> : null}
        <p role="status">{lastReply}</p>
      </section>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
        <button onClick={startInterview} disabled={status === "starting" || !consentAccepted}>
          {status === "starting" ? "Starting..." : "Start interview"}
        </button>
        <button onClick={startListening} disabled={!interviewId || status === "thinking"}>
          {status === "listening" ? "Listening..." : "Speak answer"}
        </button>
        <button onClick={interrupt}>Interrupt speech</button>
      </div>

      <label style={{ display: "block", marginTop: 24 }}>
        Text fallback
        <textarea
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          rows={6}
          style={{ display: "block", width: "100%", boxSizing: "border-box", marginTop: 8 }}
          placeholder="Type your answer when voice input is unavailable."
        />
      </label>
      <button onClick={submitText} disabled={!interviewId || !transcript.trim() || status === "thinking"} style={{ marginTop: 12 }}>
        Submit text answer
      </button>

      <p role="status" style={{ marginTop: 16 }}>Status: {status}</p>
    </main>
  );
}
