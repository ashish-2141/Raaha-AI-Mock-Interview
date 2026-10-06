# Raaha AI Mock Interview

Day 4 extends the Day 3 adaptive interview engine with a real-time voice interview slice.

Day 3:
- Adaptive evaluate -> question graph
- Resume, role and branch context
- Follow-up probing and difficulty adjustment
- Anti-repetition
- Redis persistence utility

Day 4:
- Browser speech input with SpeechRecognition
- Speech output with SpeechSynthesis
- POST /api/interview/voice/start
- POST /api/interview/voice/turn
- Explicit interruption handling
- Text fallback for unsupported voice input
- Deterministic local fallback for network/API failure
- Latency instrumentation

The voice layer is provider-agnostic. Production speech-provider integration can be added later without changing the interview-state API.

Run:
pnpm install
pnpm check
pnpm build

Required environment for voice API execution:
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
REDIS_URL

The Android weak-network under-2-second acceptance target is not claimed until measured on a real device and connection.
