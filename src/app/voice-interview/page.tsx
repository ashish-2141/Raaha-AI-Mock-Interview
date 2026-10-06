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
};

const INTERVIEW_ID_STORAGE = "raaha.voice.interviewId";

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
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(INTERVIEW_ID_STORAGE);
    if (stored) setInterviewId(stored);
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
      setLastReply(payload.followUp ? "Follow-up probe selected." : "Next question selected.");
      setDifficulty(payload.difficultyScore);
      setLatencyMs(payload.latencyMs || roundLatency);
      setStatus("idle");
      speak(payload.nextQuestion);
    } catch {
      const fallback = `Network is slow. Continue safely with the text question: explain how you would test the answer you just gave.`;
      setLastReply("Offline-safe fallback used.");
      setQuestion(fallback);
      setLatencyMs(Math.round(performance.now() - startedAt));
      setStatus("idle");
      speak(fallback);
    }
  }, [interviewId]);

  async function startInterview() {
    setStatus("starting");
    try {
      const id = interviewId || crypto.randomUUID();
      const response = await fetch("/api/interview/voice/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId: id,
          branch: "CSE",
          role: "Junior Backend Developer",
          difficultyScore: 3,
          resumeProjects: [],
        }),
      });

      if (!response.ok) throw new Error("Unable to start.");
      const payload = (await response.json()) as VoicePayload;
      setInterviewId(id);
      window.localStorage.setItem(INTERVIEW_ID_STORAGE, id);
      setQuestion(payload.nextQuestion);
      setDifficulty(payload.difficultyScore);
      setLatencyMs(payload.latencyMs);
      setLastReply("Interview started.");
      setStatus("idle");
      speak(payload.nextQuestion);
      startedRef.current = true;
    } catch {
      setStatus("error");
      setLastReply("Could not start the interview. Make sure the API is authenticated and Redis is configured.");
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
    <main style={{ maxWidth: 760, margin: "0 auto", padding: 32 }}>
      <h1>Real-time voice interview</h1>
      <p>Speak your answer, hear the next question, or use the text fallback when voice is unavailable.</p>

      <section aria-live="polite" style={{ marginTop: 24 }}>
        <strong>Question</strong>
        <p>{question}</p>
        <p>Difficulty: {difficulty}/5</p>
        {latencyMs !== null ? <p>Last response: {latencyMs} ms</p> : null}
        <p>{lastReply}</p>
      </section>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
        <button onClick={startInterview} disabled={status === "starting"}>
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
          style={{ display: "block", width: "100%", marginTop: 8 }}
          placeholder="Type your answer when voice input is unavailable."
        />
      </label>
      <button onClick={submitText} disabled={!interviewId || !transcript.trim() || status === "thinking"} style={{ marginTop: 12 }}>
        Submit text answer
      </button>

      <p role="status" style={{ marginTop: 16 }}>
        Status: {status}
      </p>
    </main>
  );
}
