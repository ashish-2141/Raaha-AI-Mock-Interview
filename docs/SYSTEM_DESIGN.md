# System design and technology trade-offs

**Status:** technical proposal implemented in part; manager sign-off, measured load results, and real-world acceptance evidence are still pending. This document is not an assertion that a measured 1,000-student load test or 10-student pilot has occurred.

## 1. Requirements and system boundary

Raaha's first-week coding scope is an interview-practice product with authentication, resume extraction, adaptive questions, browser voice input/output, isolated coding challenges, evidence-oriented feedback, cohort-only college insight, operations telemetry, and a deployable web service.

The product is a learning aid, not an automated hiring decision or formal academic grading system. Scoring and integrity signals require human interpretation.

### Current request flow

1. A student signs in with Supabase Auth.
2. The student uploads a PDF. The server checks type, a 5 MB size limit, a 10-page limit, and a 50,000-character extraction limit; it extracts text and requests a structured profile from the OpenAI Responses API. Zod validates the returned profile.
3. The resume page transfers only the branch, selected target role, and project name/tech stack/summary into tab-scoped session storage. The student's full name, CGPA, and general skill list are not copied into this interview context.
4. The student reviews the role and branch, accepts the consent notice, and starts an interview. The server persists interview state in Redis. The question graph uses the project context, answer history, prior concepts, and current difficulty to choose a question or follow-up.
5. Browser SpeechRecognition/SpeechSynthesis handle voice input/output. A text path is available. A server-hosted, isolated Docker runner executes the live-coding challenge.
6. The evaluator returns a deterministic rubric score and review-only integrity signals. A TPO sees only consented cohort aggregates that meet the minimum group size.
7. Request latency/status and model token usage are logged. Cost remains unknown unless the actual input/output token rates are configured.

## 2. Technology decisions and rejected alternatives

The selected stack reflects the current code. Alternatives below are considered rather than claiming that one framework is universally best.

| Layer | Selected | Alternative A | Alternative B | Why selected; reasons alternatives were not selected for this first slice |
|---|---|---|---|---|
| Web framework | Next.js App Router + React | React SPA + FastAPI | React SPA + Spring Boot | One repository contains browser pages and typed API handlers, reducing early integration work. FastAPI would split the team across Python and TypeScript; Spring Boot is a strong option but adds a second runtime/service boundary for the small first-week team. Reconsider if staffing, enterprise integration, or service ownership justifies it. |
| Language | TypeScript | Java | Python | Shares request types across UI and API and fits the Next/LangGraph implementation. Java is a viable choice if the product is primarily enterprise Java; Python is attractive for ML/data work but would add a second runtime here. |
| Authentication | Supabase Auth + `@supabase/ssr` | Auth.js with an identity provider | Self-hosted OIDC/Keycloak | Hosted auth avoids writing password, reset, session rotation and account security code. Auth.js is viable if identity-provider portability is a priority; self-hosting adds patching and availability work. The Supabase URL/key are still required to enable sign-in. |
| Profile database | PostgreSQL with Prisma schema prepared | MySQL | MongoDB | Relational profiles and future interview/evidence relations fit constraints and joins. MySQL is equally viable if the existing org standard is MySQL. MongoDB was not preferred because profile/interview relationships and report aggregates are naturally relational. Current interview sessions are stored in Redis; the Prisma schema is not proof of persistent profile CRUD. |
| AI resume extraction | OpenAI Responses API with Zod-backed schema | Anthropic structured output | Self-hosted model | Existing SDK integration parses into a declared schema. Anthropic is a credible provider alternative; self-hosting increases serving, GPU, monitoring and model-upgrade burden. Provider/model choice must be revisited against actual extraction accuracy, privacy terms, latency and account-specific rates. No AI cost or accuracy is assumed without measurement. |
| Interview state | LangGraph.js + explicit state + Redis TTL | Hand-written finite-state machine + Redis | Managed workflow engine | The graph makes evaluate/ask transitions explicit and testable. A hand-written state machine could reduce dependencies for a tiny graph; a managed workflow engine would add operational cost/complexity not justified by this short session workflow. |
| Voice | Browser SpeechRecognition and SpeechSynthesis with text fallback | Hosted cloud speech-to-text/text-to-speech | Realtime speech/LLM API | Avoids a server-side audio provider charge and keeps the first slice small. Browser support and network quality vary; hosted speech may be more consistent but introduces per-minute costs, data-processing obligations and latency. The required Android weak-network timing has not been measured. |
| Coding execution | Docker container with disabled network, resource limits, read-only mounts/root filesystem, dropped capabilities and timeout cleanup | Remote execution service | Browser-only interpreter | Local container isolation is inspectable and avoids passing code to a third-party runner. A managed execution service may offer stronger operational isolation, but requires vendor review and potential fees. Browser-only execution cannot safely validate backend-held hidden tests. The Docker-capable host and runtime adversarial tests remain acceptance gates. |
| Session cache | Redis-compatible Key Value store | PostgreSQL session storage | In-process memory | Redis gives shared short-lived session state across route invocations. PostgreSQL could make persistence durable but adds DB-backed write load; local memory fails across restarts/instances. The current free staging Redis is ephemeral and must not be treated as durable production storage. |
| Hosting | Render Free staging plus a Docker deployment path | Paid managed web/cache service | Self-hosted Linux + TLS reverse proxy | Free resources allow zero-charge health/build checks; sleep and ephemeral storage make them staging-only. Paid managed services improve availability/persistence but incur charges. Self-hosting offers more control and requires patching, backups, TLS, monitoring and on-call operation. No paid services are enabled. |

### Why the current database layer is not complete persistence

The Prisma schema documents intended relational models, but the current working interview flow stores session state in Redis with a 24-hour inactivity TTL. Do not claim that resumes, profiles, interview transcripts or evaluations are durably stored in PostgreSQL unless a migration, write path, retention policy, and tests are added.

## 3. Quality, privacy and security constraints

- Authenticate API routes that access user-specific profiles, interview sessions, coding submissions, dashboard aggregates or operational metrics.
- Validate all external data at the trust boundary. Resume instructions are untrusted input; model output is parsed and validated against the profile schema.
- Keep hidden coding tests and expected outputs outside the candidate execution environment. Execute one case per short-lived container; never mount the full suite into a candidate-accessible directory.
- Apply network isolation, non-root execution, CPU/memory/PID/time limits, read-only root and source mounts, no-new-privileges, and timeout cleanup.
- Candidate code must never be executed inside the Next.js application process.
- Consent must be explicitly accepted before voice interview start. College attribution and dashboard access are assigned server-side.
- Show aggregate cohort data only. Suppress the overall cohort below five distinct consenting participants and suppress each branch/skill group below five distinct participants.
- Treat automated integrity flags as review-only signals, not proof of cheating or grounds for automatic score penalties.
- Do not put API keys, invite codes, authentication cookies, raw student answers, names, or candidate identifiers in source control or operational reports.
- The free staging Redis service has persistence disabled. Do not use it for real student data or an approved pilot.

## 4. Latency target and validation plan

The document's product target is for an interviewer reply to begin in under two seconds and for voice to remain usable on a phone with a weak connection. This is an acceptance target, **not a measured result**.

Initial measurement budget for the adaptive turn endpoint (planning hypothesis, not a promise):
- p50 server turn response: at or below 500 ms.
- p95 server turn response: at or below 1,500 ms.
- UI response-to-next-question target: below 2 seconds on the selected supported phone/browser/network test.
- Resume extraction is a separate model-backed operation and must be measured separately from an interview turn.

Measure from a real Android device and record device/browser, network condition, timestamp, request count, median/p95/max latency, error rate, and whether speech interruption/fallback worked. Run at least 30 turns per network condition and report all failures; do not substitute browser emulation for a real weak-network test. The thresholds above should be approved or revised by the manager before acceptance.

## 5. Cost per interview

No verified cost-per-interview figure is available yet. The current interview question/scoring path is deterministic, and browser speech uses browser APIs. The OpenAI API is used for resume extraction; optional future model-based interview turns would add their own token cost.

For each resume parse, estimate:
`cost_parse = input_tokens / 1,000,000 × input_rate + output_tokens / 1,000,000 × output_rate`

For an interview that includes resume parsing:
`cost_interview = cost_parse + speech_provider_cost + amortised_hosting_cost + other_provider_costs`

For the current browser speech and heuristic scoring path, speech-provider cost is not charged by this application; that does not mean the whole service is free. Model rates must be configured from the actual account's approved pricing. Record actual token usage and report unknown as unknown rather than zero. Hosting free-tier costs do not imply availability or durability suitable for production.

## 6. Capacity thought experiment: 1,000 interviews/day

This is a sizing hypothesis, not a load-test result.

Assumptions:
- 1,000 interviews/day.
- 10 minutes average duration per interview.
- 6 answer turns per interview.
- Most activity occurs over an 8-hour window.

Derived planning values:
- 10,000 interview-minutes/day = about 166.7 interview-hours/day.
- Spread across 8 hours, about 20.8 concurrent interviews on average.
- A 10x short burst suggests about 208 concurrent interviews.
- Six turn requests per interview is approximately 6,000 turn requests/day, before resume parsing, sign-in, polling and retries.

Expected bottlenecks to measure are concurrent speech recognition on client devices, Node route availability, Redis connections/latency and memory, model rate limits on resume parsing, free-host sleep/restarts, and sandbox resource contention. The free staging plan is not capacity evidence and is not intended to support this workload.

Before claiming 1,000/day capacity, conduct an approved step-load against a production-like environment (e.g. 25, 50, 100, then target concurrency), run for at least 15 minutes at target load, and record success/error rates, p50/p95 latency, CPU, memory, Redis behaviour, queueing, restart events, and costs. Stop on error-rate spikes or saturation. An authenticated dashboard load test is a separate acceptance test and requires an authorised TPO session.

## 7. Acceptance matrix

| Requirement | Automated evidence in repo | Evidence still required |
|---|---|---|
| Design and CI | Architecture, data model, API, stack decisions and CI | Manager's explicit approval/sign-off |
| Resume parsing | Schema validation and synthetic fixtures | 10 real, consented PDFs; human-checked reference values; fewer than 10% field errors |
| Adaptive interviews | State-graph unit tests | Three end-to-end test interviews through the deployed product, including earlier-answer-dependent follow-ups |
| Voice | Protocol tests and text fallback | Real-device Android test on weak network; measured under-two-second response target |
| Live coding | Sandbox policy tests and Docker runtime integration tests | Verify timed-out container is killed; adversarial cases for network/filesystem escape; browser/device end-to-end run on Docker-capable host |
| Fair scoring | Deterministic rubric tests, repeatability tests and review-only integrity tests | Question-specific validation, a controlled identity-bias review, score consistency report and prompt-injection test record |
| Dashboard | Cohort aggregation/privacy tests, free health smoke test, operational metrics | Configure Supabase/TPO; authorised and unauthorised access test; authenticated load-test output |
| Pilot | Consent flow and documented protocol | Written partner approval; 10 real, distinct, consenting participants; actual completion/latency/error/feedback measurements; post-mortem |

## 8. Decision and sign-off record

- Current implementation revision: see the repository's latest `main` commit and CI run.
- Proposal owner: [assign owner].
- Manager / reviewer: [name].
- Approved stack and rationale: pending manager review.
- Cost ceiling: [obtain explicit approval before any paid service/API usage].
- Load-test and real-device results: pending measurement.
- Pilot partner and dates: pending written approval.
- Production go/no-go: **not approved by this document**.
