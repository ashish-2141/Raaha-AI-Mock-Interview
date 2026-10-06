# Architecture

Day 3 adaptive state machine:
START -> evaluate answer -> follow-up or difficulty adjustment -> select next non-repeated question -> END

Day 4 voice boundary:
Browser SpeechRecognition -> transcript -> POST voice/turn -> adaptive interview graph -> next question -> SpeechSynthesis

Safety and reliability:
- Supabase authentication protects voice APIs.
- Zod validates external inputs.
- Redis keeps interview state inspectable across requests.
- Text input remains available when voice is unsupported.
- Network failure falls back to a deterministic question instead of dead-ending the interview.
- Speech interruption cancels active speech and returns the UI to a safe idle state.
- Candidate code is never executed inside the Next.js process.
