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

Day 5 decision: keep candidate code execution outside the Next.js process.

Candidate code is sent to a dedicated Docker sandbox with network disabled, resource limits, dropped Linux capabilities, no-new-privileges, read-only root filesystem, and a read-only source mount. Hidden cases stay server-side and only aggregate results are returned.

Production acceptance still depends on a Docker-capable host, a pinned sandbox image, sandbox monitoring, and a real browser/device E2E test.

Day 6 decision: run one fair, deterministic score path through the shared interview graph.

The score is a weighted 0-100 signal mapped to the existing 0-5 qualityScore contract. Prompt-injection, answer-leakage, duplicate-answer, and speed signals are review-only. Prior answers and elapsed response duration are derived from the server-owned Redis session rather than client-provided values.

Trade-off:
The heuristic improves inspectability and repeatability but does not prove semantic correctness or cheating. High-stakes use requires question-specific validation and human review.
