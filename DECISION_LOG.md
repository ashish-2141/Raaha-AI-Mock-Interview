# Decision Log

Decision: use a TypeScript-first monorepo with Next.js and PostgreSQL for the first production slice.

Options considered:
1. Next.js + TypeScript + PostgreSQL
2. React + FastAPI + PostgreSQL
3. Spring Boot + React + PostgreSQL

Why:
The first week needs fast feedback with clear service boundaries. TypeScript-first reduces integration overhead.

Trade-off:
Prioritizes development speed and shared types over cross-language diversity.

Day 4 decision: keep voice I/O separate from interview-state orchestration.

The first voice slice uses browser SpeechRecognition and SpeechSynthesis. The backend retains the adaptive interview state and timing metadata. A text-safe deterministic fallback is used when a network round fails.

The Android weak-network under-2-second criterion remains an acceptance test, not a design assumption. It requires real-device measurement.
