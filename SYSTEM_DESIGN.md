# System Design and Stack Trade-offs

**Status:** implementation-aligned design, prepared after the first feature slices. It is not yet manager-approved. Approval must be recorded here before calling the Day 1 design gate complete.

**Review date:** 2026-10-10  
**Source of truth:** the current repository. Proposed future AI turns are clearly distinguished from implemented rule-based turns.

## 1. Current implementation versus target

The current application uses Next.js/TypeScript, Supabase Auth, a Zod-validated OpenAI Responses call for resume parsing, browser Web Speech APIs for voice input/output, a deterministic LangGraph interview workflow, Redis for short-lived interview state, and a Docker sandbox for coding execution.

Important limitations:
- Interview question selection and scoring are deterministic rules and a question bank today. The text/voice turn path does **not** call an LLM to generate every question or evaluate every response semantically.
- Resume profiles are schema-validated, but durable PostgreSQL persistence is not yet wired into the user journey.
- The free Render staging deployment has ephemeral Key Value storage and is not production or pilot infrastructure.
- Browser SpeechRecognition/SpeechSynthesis availability, language quality and latency vary by browser/device/network.
- The coding sandbox requires a Docker-capable host. The free web host's successful application build does not prove the sandbox can execute containers there.

## 2. Alternatives and decisions

| Layer | Selected for this slice | Alternative A | Alternative B | Why selected now / rejection trade-off |
|---|---|---|---|---|
| Language | TypeScript | Java/Kotlin | Python | Shared types between UI, API, schemas and tests keep the first iteration small. Java remains viable, but splitting into separate services increases deployment work at this stage. |
| Web framework | Next.js App Router | React + FastAPI | React + Spring Boot | One repo provides UI, route handlers and CI. Separate services offer clearer independent scaling, but add auth, deployment and tracing boundaries before workload is measured. |
| Authentication | Supabase Auth with SSR cookie sessions | Auth.js + an external identity provider | Self-hosted OIDC (e.g. Keycloak) | Managed identity reduces password/session handling in this prototype. It introduces a provider dependency; self-hosted identity increases security and operations burden. |
| Structured resume extraction | OpenAI Responses API + Zod schema, currently `gpt-5.5` by default | Anthropic API with validated JSON | Gemini API with structured output | The current route already uses the OpenAI SDK and a Zod-backed format. Switching providers requires comparative extraction tests, data review and cost/latency measurements, not just changing a model string. |
| Interview policy/orchestration | LangGraph + deterministic rubric for the current slice | Pure TypeScript state machine | LLM-generated turn plan with a constrained schema | LangGraph makes the evaluate/question stages explicit and testable. Deterministic logic is cheap/repeatable but is not equivalent to semantic AI interviewing. Adding LLM-generated turns is a separate costed change with question-quality and injection tests. |
| Session state | Redis-compatible store with a 24-hour inactivity TTL | PostgreSQL session/turn tables | Managed document database | Redis supports quick reads/writes for active turns, but the configured free store is ephemeral and unsuitable for durable history. PostgreSQL is the preferred durable record store once schema, ownership, retention and migrations are implemented. |
| Durable profile and reporting database | **Not wired yet**; Prisma/PostgreSQL schema groundwork exists | Supabase Postgres directly | Managed PostgreSQL outside Supabase | Keep this as an explicit blocker: Prisma dependency/schema does not mean resume/interview records are persisted. Prefer PostgreSQL for durable, relational ownership and reporting once RLS/migrations/retention are reviewed. |
| Voice I/O | Browser SpeechRecognition + SpeechSynthesis, with text fallback | Managed speech-to-text/text-to-speech APIs | Full-duplex realtime audio API | Browser APIs avoid adding a paid speech service to the zero-cost staging slice, but are not consistent across browsers and do not guarantee streaming/interrupt latency. A managed provider needs a privacy review, budget and device benchmark before adoption. |
| Code execution | Separate Docker container per submission, no network, read-only FS, dropped capabilities and resource limits | Dedicated sandbox service / microVM | Remote execution vendor | Docker makes the isolation boundary inspectable, but ordinary containers still share the host kernel. A hardened sandbox service or microVM is stronger for untrusted public submissions. Never execute candidate code in the Next.js process. |
| Hosting | Render Free staging only | Paid managed container service | Self-hosted Docker on a secured Linux host | Free hosting verifies build and health only; sleep, ephemeral state and limited resources disqualify it for a real student pilot. Paid hosting is outside the current no-spend authorization. Self-hosting requires patching, TLS, backup and incident ownership. |
| CI and tests | GitHub Actions, Vitest, Playwright, Docker build | Separate CI vendor | Manual QA only | Versioned checks are repeatable and run on pushes/PRs. Manual-only checks were rejected because they do not prevent regressions. Real-device, real-resume and real-student acceptance still require external test evidence. |

## 3. Cost model

OpenAI's public API pricing page lists standard GPT-5.5 text-token rates of **$5 per 1 million input tokens** and **$30 per 1 million output tokens** as reviewed on 2026-10-10. Recheck the official [API pricing page](https://developers.openai.com/api/docs/pricing) before approving a budget; model rates and service terms can change. This estimate excludes cached-token discounts, regional uplifts, retries, taxes, hosting, database, and any separately billed speech service.

Formula:

`cost = input_tokens / 1,000,000 * input_rate + output_tokens / 1,000,000 * output_rate`

### Implemented billable path: one resume parse

Planning envelope, not a measurement: 5,000 input tokens and 700 output tokens per parsed resume.

- Input: 5,000 / 1,000,000 × $5 = $0.025
- Output: 700 / 1,000,000 × $30 = $0.021
- **Illustrative resume-parse total: $0.046 per resume**
- If all 1,000 daily users each parse one resume: approximately $46/day or $1,380 per 30-day month.

Actual token counts must come from `response.usage`; this repository already records token usage. Set the `RAAHA_OPENAI_*_USD_PER_1M` environment variables to the approved rates so runtime summaries can estimate costs. An unknown cost is not zero.

### Future target: add AI-generated interview turns

This is a planning scenario, **not the current implementation**. Assume eight LLM turns averaging 1,500 input and 200 output tokens each, plus one resume parse using the envelope above:

- Interview turns: 12,000 input and 1,600 output tokens = $0.060 + $0.048 = $0.108.
- Resume parse: 5,000 input and 700 output tokens = $0.025 + $0.021 = $0.046.
- **Illustrative combined total: $0.154 per interview with one resume parse.**
- At 1,000 such interviews/day: about $154/day or $4,620 per 30-day month, before non-token costs.

The current heuristic interview turn itself makes no model call, so do not report the future scenario as current spend. The model-turn token envelope must be measured from an approved pilot before presenting a reliable per-interview figure.

## 4. Latency targets and measurement plan

The plan's user-facing acceptance target is that the voice reply starts in under two seconds on a phone with a weak connection. Treat this as an end-to-end target, not as an assumed property of the framework.

Record separate timings for:
1. browser speech recognition final-transcript delay;
2. request/network round-trip;
3. session load + interview graph + session save;
4. time from transcript finalization until speech synthesis starts;
5. full-turn completion time.

Acceptance: test on a named Android device, a named browser/version, and a documented weak-network profile; run at least 30 turns; report median, p95, maximum and failures. The current repository does not yet contain that real-device result. The deterministic API portion should have an internal p95 budget of 500 ms under the pilot concurrency, leaving headroom for the network and browser speech engines; this is a design target, not a measurement.

## 5. Capacity model for 1,000 students/day

Planning assumptions:
- 1,000 interview starts/day.
- Peak scheduling window: eight hours.
- Average active interview duration: ten minutes.
- Eight submitted answers/turns per interview.

Derived baseline:
- 125 interview starts/hour during that window, approximately 2.1 starts/minute.
- Approximately 21 concurrent interviews on average during a uniform ten-minute workload; target at least 2× headroom (42 concurrent sessions) for uneven arrivals, not a substitute for a load test.
- Approximately 8,000 answer turns/day, before resume-parse requests, retries or abandoned sessions.

At that volume, the free deployment is not a suitable capacity claim: it may sleep and its Key Value store is ephemeral. Before a production decision, implement durable relational persistence and backup/retention, test Redis connection/pooling and failure behavior, set provider rate limits/cost caps, measure model token use and turn latency, and run a staged load test with approved concurrency. Do not run a 1,000-student load test against the free staging deployment.

## 6. Security, privacy and failure behaviour

- Require authentication on all user-specific routes; never trust a client-supplied owner or college ID.
- Require explicit consent before storing an interview in a college cohort.
- Do not expose hidden coding tests or raw student answers in TPO aggregates.
- Suppress the overall cohort below five distinct consenting participants and suppress each branch/skill group below five.
- Treat anti-cheat flags as review signals, not as proof or automatic score penalties.
- Run candidate code only in the isolated sandbox; reject unsafe inputs and kill/remove timed-out containers.
- Store no secrets in Git, client-side bundles (except intentionally public Supabase values), logs or reports.
- Define deletion/retention, request-budget and incident-response procedures before collecting real student data.

## 7. Decision and acceptance record

- [ ] Manager reviewed and approved alternatives, cost assumptions and capacity model.
- [x] Application architecture, API outline and data-model intent documented.
- [x] CI runs on pushes and pull requests.
- [ ] PostgreSQL persistence and migration/retention path implemented and tested.
- [ ] Ten consented real resumes checked against human-reviewed reference fields; field error rate <10%.
- [ ] Real Android weak-network latency test meets the <2 s reply-start target.
- [ ] Docker integration tests show normal solution success, wrong solution failure, and infinite-loop timeout/cleanup.
- [ ] Same answer repeated five times varies by no more than one point; bias/injection cases reviewed.
- [ ] Authenticated dashboard load-test output retained for an approved concurrency.
- [ ] Partner college approved the pilot and ten real students have consented and used the tool.
- [ ] Measured one-page post-mortem written.

No pending external acceptance item may be marked complete from synthetic fixtures, CI alone, or an HTTP health check.
