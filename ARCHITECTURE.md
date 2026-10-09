# Architecture

Day 3 adaptive state machine:
START -> evaluate answer with deterministic rubric -> follow-up or difficulty adjustment -> optional model-generated question -> deterministic non-repeated question fallback -> END

Question generation is deterministic by default. `RAAHA_AI_INTERVIEW_ENABLED=true` opts into structured model-generated questions, bounded to recent history and resume context. Model output never sets the score; the scoring rubric remains a separate deterministic function.

Day 4 voice boundary:
Browser SpeechRecognition -> transcript -> POST voice/turn -> adaptive interview graph -> next question -> SpeechSynthesis

Safety and reliability:
- Supabase authentication protects voice APIs.
- Zod validates external inputs.
- Redis keeps interview state inspectable across requests.
- OpenAI question generation and code review have separate opt-in flags and are disabled by default; missing configuration and model errors use deterministic feedback instead.
- Text input remains available when voice is unsupported.
- Network failure falls back to a deterministic question instead of dead-ending the interview.
- Speech interruption cancels active speech and returns the UI to a safe idle state.
- Candidate code is never executed inside the Next.js process.

## System architecture

~~~mermaid
flowchart TB
  Student["Student browser"]
  TPO["Authorised TPO browser"]
  Web["Next.js pages and route handlers"]
  Auth["Supabase Auth<br/>when configured"]
  Resume["PDF extraction + Zod schema"]
  ResumeAI["OpenAI Responses API<br/>structured profile, billable"]
  Graph["LangGraph interview graph"]
  Score["Deterministic evidence rubric<br/>+ review-only integrity flags"]
  Question["Optional AI question generation<br/>off by default"]
  Redis["Redis-compatible session store<br/>24-hour inactivity TTL"]
  CodingAPI["Authenticated coding API"]
  HostRunner["Host-side test runner<br/>expected results stay here"]
  Sandbox["Docker container<br/>non-root, no network, read-only root, limits"]
  CodeReview["Optional AI code review<br/>server flag + user consent"]
  Dashboard["TPO aggregate dashboard<br/>server-side college mapping"]
  Ops["Operational metrics + structured logs"]

  Student --> Web
  TPO --> Web
  Web --> Auth
  Web --> Resume
  Resume --> ResumeAI
  Web --> Graph
  Graph --> Score
  Graph --> Question
  Graph <--> Redis
  Web --> CodingAPI
  CodingAPI --> HostRunner
  HostRunner -->|"solution + current test input only"| Sandbox
  Sandbox -->|"candidate output only"| HostRunner
  HostRunner -->|"actual output compared with hidden expected output"| CodingAPI
  CodingAPI -. "if feature enabled and consented" .-> CodeReview
  Web --> Dashboard
  Dashboard --> Redis
  Web --> Ops
  Ops --> Redis
~~~

### Boundaries that matter

- Supabase-backed route access is unavailable until a real project URL and publishable key are configured. CI uses a reserved .invalid placeholder, and authenticated API routes return a clear HTTP 503 for missing configuration instead of an unhandled server error.
- Resume parsing sends extracted resume text to the configured OpenAI API and can incur usage charges. It has not been exercised on the no-spend staging service.
- Interview scoring remains deterministic. Optional model-generated questions require RAAHA_AI_INTERVIEW_ENABLED=true; a repeated generated question falls back to the deterministic non-repeating question bank.
- Hidden coding test definitions and expected outputs remain in the web-server process. The isolated container receives only the candidate's solution and one test input at a time. Only the output comes back for comparison.
- AI code review is disabled by default and requires both the server feature flag and the participant's explicit consent. Hidden test inputs and expected outputs are never sent to the review model.
- The free Render environment verifies packaging and health only. Its Key Value storage is ephemeral; the sandbox needs a Docker-capable host, and the app needs real Supabase configuration before an authenticated student journey can be accepted.
