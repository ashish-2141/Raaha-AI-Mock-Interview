# Free-only architecture audit and implementation status

**Audit date:** 10 October 2026  
**Repository:** `ashish-2141/Raaha-AI-Mock-Interview`  
**Policy:** no paid API requests, paid cloud tiers, paid add-ons, or silent paid fallback.

## Executive decision

Raaha can remain at a **zero planned service spend for prototype/staging** by retaining the current Render Free deployment and Supabase Free project, using browser-native voice APIs and deterministic application logic where available, and treating any third-party free API as optional and quota-limited.

It is not accurate to promise that every requirement is already fulfilled by a wholly open-source stack. There are three separate concepts:

1. **Open-source software:** a library's licence allows use under its licence terms.
2. **Free hosted tier:** a provider supplies a limited quota and may change limits, suspend inactive resources, or require paid features for higher availability.
3. **Free API usage:** a particular account/model is currently within a provider's free quota. This is not unlimited, guaranteed, or necessarily suitable for sensitive student data.

This audit documents an implementable target, not a claim that proposed providers or browser-local models have already been integrated. The repo's existing AI resume parser still calls the OpenAI Responses API. Under the strict no-paid policy, that path must remain disabled until it is replaced or a reviewed free provider adapter is implemented. **Do not add an OpenAI key or silently fall back to a paid provider.**

## Current deployment and stack: evidence-based

| Area | Current state at audit | Free-only interpretation |
|---|---|---|
| Web application | Next.js 16.3.8, React 19.3.0, TypeScript; pnpm, Biome, Vitest and Playwright | Keep the tested project versions. Do not downgrade to Next.js 15 merely because a draft blueprint names it. |
| Hosting | Render Free service `raaha-ai-mock-interview-free`; current URL: https://raaha-ai-mock-interview-free.onrender.com | Live as a staging/smoke-test deployment, not accepted production hosting. Free instances can sleep/restart. |
| Authentication | Supabase Auth SSR integration is in source; the new project `raaha-ai-mock-interview` is healthy on the Free plan in Mumbai (`ap-south-1`). URL and publishable key plus `NEXT_PUBLIC_APP_URL` were added to Render. The environment-triggered deployment became live on commit `c5a58565f3f68d9fd4fa17e4846e682db29539ac`. | Test sign-in, sign-out, email confirmation, redirect URLs, and unauthorized access after the environment change before claiming auth acceptance. |
| PostgreSQL | Supabase reports no tables in the public schema at audit time. | Do not claim durable profile, resume, or transcript persistence in Postgres without migrations, RLS policies, write paths, and tests. `pgvector` is an optional future extension, not currently used. |
| Session/cache | Render Key Value (Redis-compatible) is configured in Singapore; `render.yaml` sets persistence off. The interview session path uses Redis with a 24-hour inactivity TTL. | Acceptable for staging only. Redis state can be lost on restart; do not use it as the sole durable store for real student records. |
| Resume extraction | `src/app/api/resumes/parse/route.ts` extracts PDF text with `unpdf`, then `src/lib/resume/parse-resume.ts` calls the OpenAI Responses API with Zod structured output. | This is **not zero-spend ready**. No paid OpenAI key is configured. Mark live AI resume parsing blocked until a tested free/local implementation replaces the call. |
| Adaptive interview/scoring | The answer evaluator in `src/lib/interview/evaluate.ts` is deterministic heuristic logic; interview flow and question graph are in-repository. | No LLM request is required for that evaluator as currently written. Keep deterministic fallback behavior and tests. |
| Voice | Current app uses browser `SpeechRecognition`/`SpeechSynthesis` with typed fallback and interruption handling. | Avoids a paid speech API. Browser behavior, language availability, whether recognition is on-device, and latency vary. Do not claim that audio never leaves the device or that the <2 second target is met without testing the specific browser/device. |
| Live coding | Source invokes the Docker CLI with network disabled, resource limits, read-only mounts, dropped capabilities, and cleanup. CI runs integration checks in a Docker-capable environment. | Source and CI tests do not prove that the live Render host can access a Docker daemon or provides an adequate production isolation boundary. Keep public untrusted-code execution disabled until the intended host and adversarial tests pass. |
| Monitoring/load test | API metrics and an authenticated dashboard load-test script are present. Langfuse and k6 are not integrated by the current package/scripts evidence. | Optional future additions only. Do not claim Langfuse traces, k6 results, or a live authenticated load test without run evidence. |
| CI | GitHub Actions runs repository checks and build/test jobs. | Standard GitHub-hosted Actions minutes are free for public repositories; private-repository quotas depend on the account plan. Do not assume a universal 2,000-minute allowance. |

## Audit of the proposed blueprint

### 1. Framework and hosting

- **Keep Next.js 16.3.8**, not Next.js 15. The repository is already built and CI-tested against its current dependencies; changing major versions is not needed to save API money.
- **Keep Render Free for staging.** Do not move the current app to Vercel Hobby as the default commercial deployment: Vercel documents Hobby for personal, non-commercial use. Do not represent Render Free as production-grade or persistent.
- Keep the public staging URL for health and page-route smoke tests only. Do not use it for real student data or a pilot until the outstanding acceptance gates below pass.

### 2. Supabase and persistence

The Supabase organization is on the Free tier, the project is healthy, and Render has the public project URL/publishable key. No service-role/secret key was added to the frontend. This is deployment configuration, not proof that a student can successfully sign in.

Current Supabase Free documentation lists 500 MB Postgres database size, 50,000 monthly active users, 1 GB file storage and 5 GB egress; Free projects may be paused after a week of low activity and do not include automatic database backups. Values and provider rules can change. A GitHub Actions cron pinger is not a substitute for an availability commitment or a backup plan.

Before real data:
1. Test email/password sign-in and recovery, email confirmation and the exact Render redirect URL.
2. Create reviewed schema migrations and row-level security policies for any durable records actually required.
3. Define student consent, retention/deletion, backup/export and access-control procedures.
4. Keep session state ephemeral only where loss is acceptable; do not treat Redis TTL data as a durable interview record.

### 3. AI and strict no-spend behavior

**Current blocker:** `parseResumeText()` instantiates the OpenAI client and uses `OPENAI_RESUME_MODEL` (defaults to `gpt-5.5`). A valid API key can incur charges. The current code does not call Gemini or Groq.

Recommended migration path:
- Introduce a small provider interface for resume extraction and validate every output with the existing `ResumeProfileSchema`.
- Prefer a deterministic local parser for basic PDF fields when no reviewed free AI provider is configured. It should return explicit unknown/empty values rather than invent skills, grades, projects or CGPA.
- If a free hosted model is later enabled, make it an explicit opt-in deployment setting. At the time of this audit, Google's Gemini API pricing page lists `gemini-2.5-flash-lite` with free-tier pricing; the active project's actual RPM/TPM/RPD limits must be checked in AI Studio because limits vary by model and account and are not guaranteed.
- Review provider data terms before sending resumes or answers. Google's API pricing page identifies free-tier use as data that may be used to improve its products. Do not send identifiable student resumes or private interview answers to a free external endpoint without explicit owner approval, appropriate notice/consent, and a data-handling review.
- Enforce a hard stop when the free quota is exhausted or the key is absent. Do not automatically switch to paid billing/model tiers. Record status as `unavailable/free-quota-exhausted`, not as $0 measured cost.
- Groq's published base Free Plan table currently lists `llama-3.3-70b-versatile` at 30 requests/minute, 1,000 requests/day, 12,000 tokens/minute and 100,000 tokens/day, subject to the account's current limits. It is optional and not used by the repository today. Do not hard-code these values as permanent guarantees.
- The current rubric evaluator is deterministic; a hosted "code review LLM" is not required for the current code-review/static feedback path. Keep Groq optional unless real accuracy tests justify the extra provider dependency.

Strict zero-spend policy:
1. Leave `OPENAI_API_KEY` unset.
2. Do not add a credit card or paid tier to a model provider.
3. Do not configure an automatic paid fallback.
4. Add a request budget/queue only after checking the provider's actual active limits.
5. Log request counts, errors and model identifiers; costs are zero only where provider billing records confirm no charges. Otherwise report cost as unknown.

### 4. Voice: client runtime vs actual privacy/latency

The current source uses browser Speech Recognition and Speech Synthesis. This needs no separate paid speech API, but behavior differs by browser, operating system, installed language and connection. A browser API does not by itself guarantee fully on-device transcription or that no audio is sent off-device.

Possible future enhancement: Transformers.js documents client-side automatic speech recognition with ONNX models such as `onnx-community/whisper-tiny.en` and WebGPU. WebGPU support is not universal, models must be downloaded, and cold-start/inference times depend on device memory, CPU/GPU and browser. Silero VAD is MIT-licensed, but a browser Worker/ONNX integration would still need implementation and testing. None of Transformers.js Whisper, Moonshine, or Silero VAD is claimed as integrated in the current app.

Required acceptance:
- Measure cold and warm model startup, transcription latency, turn-to-first-audio latency and interruption response on at least a low-end Android device.
- Test weak-network and offline behavior and compare 360x800/390x844 layouts.
- Keep text input functional when microphone permission or local inference is unavailable.
- Display a first-load model download notice if an on-device model is later added; do not promise a fixed 75 MB download or sub-400 ms transcription without measurements on the chosen model/build.

### 5. Live-coding sandbox

The submitted `docker run` example is a starting point, not a complete hostile-code boundary. Keep the stronger controls already reflected in the code (ephemeral containers, no network, CPU/memory/PID/time limits, read-only files, dropped capabilities, non-root user, and `no-new-privileges`). The execution worker must be isolated from application secrets and the host control plane.

Do not run candidate code in the Next.js process. Do not expose a Docker socket to the public web app. Production acceptance requires a specifically provisioned Docker-capable host/worker, pinned runtime image, rootless or equivalent hardening where supported, timeout/cleanup verification and adversarial escape/resource-abuse tests. The Render Free container is staging only until those capabilities have actually been verified there.

### 6. CI, observability and load testing

- GitHub Actions remains the primary free CI option. Costs depend on repository visibility, runner type and account allowance; avoid the claim that every repository receives 2,000 free minutes/month.
- Langfuse Cloud currently lists a free Hobby allowance of 50,000 **units** per month, 30-day history and two users. The published unit count should not be re-labelled "50,000 observations" without confirming how individual events are metered. Langfuse is not currently integrated; add only after reviewing what student-related data will be transmitted.
- The repository's current dashboard load test is `pnpm loadtest:dashboard`, implemented in `scripts/load-test-dashboard.mjs`; it requires an authorised TPO session cookie for a meaningful authenticated test. A local synthetic test is not a live deployment load test or the 10-student pilot. k6 can be added separately, but it is not a current feature.
- The current staging Redis is ephemeral. A free Upstash alternative is listed at 256 MB and 500,000 commands/month at audit time, but a migration has not been done. Do not switch stores without repeatable session, error and rate-limit tests.

## Work required before calling the product "fully free and meeting every requirement"

| Priority | Work | Acceptance evidence required |
|---|---|---|
| P0 | Verify Supabase login on the current Render deployment | Successful sign-in/sign-out, valid redirect, protected API returns 401/403 when unauthorised |
| P0 | Remove the paid OpenAI dependency from the zero-spend path | Unit tests for local parser and schema validation, plus explicit free-provider opt-in only if approved; no paid fallback |
| P0 | Validate live coding host boundary | Successful isolated run plus timeout, no-network, memory/PID, cleanup and adversarial tests on the intended deployment host |
| P1 | Add durable, consent-aware data storage only as needed | Migrations, RLS tests, retention/deletion design, backup plan and no accidental exposure of individual answers |
| P1 | Test browser voice acceptance | Recorded device/browser matrix and latency distributions; target is not met until measured |
| P1 | Run authenticated TPO load test | Preserve command parameters (without session secrets), commit/deployment SHA, window, output and error/latency results |
| P1 | Complete 10-student pilot | Partner approval, consented distinct participants, completed sessions, aggregate metrics and post-mortem |
| P2 | Consider client-local ASR/VAD, Groq, Langfuse, k6 or Upstash only where needed | Licence/terms check, privacy review, measured quality and acceptance tests |

## Official references checked on 10 October 2026

- Supabase Free plan, size/quota and inactivity pause: https://supabase.com/pricing
- Supabase free-project inactivity pausing: https://supabase.com/docs/guides/platform/free-project-pausing
- Gemini API model pricing/free-tier status: https://ai.google.dev/gemini-api/docs/pricing
- Gemini API limits vary by model/account: https://ai.google.dev/gemini-api/docs/rate-limits
- Groq API rate limits: https://console.groq.com/docs/rate-limits
- Upstash Redis Free: https://upstash.com/pricing/redis
- Vercel Hobby use and limits: https://vercel.com/docs/plans/hobby
- GitHub Actions usage/billing: https://docs.github.com/en/actions/concepts/billing-and-usage
- Langfuse pricing/units: https://langfuse.com/pricing
- Transformers.js WebGPU/ASR: https://huggingface.co/docs/transformers.js/guides/webgpu
- Silero VAD repository and MIT licence: https://github.com/snakers4/silero-vad
- Docker rootless mode and hardening: https://docs.docker.com/engine/security/rootless/

**Conclusion:** zero planned API spend is achievable for development/staging, and a free hosted AI endpoint may be used within its actual free quota after privacy review. A reliable, fully accepted production service with guaranteed availability, a securely hosted code sandbox, a persistent data store, and a ten-student pilot is not established by a collection of free tiers alone.