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
