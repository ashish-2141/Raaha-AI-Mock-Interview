# Raaha acceptance status

Updated: 2026-10-10 (free-only audit and staging configuration refresh)

This report separates code-level implementation from acceptance requiring credentials, devices, operators, real participants, or paid-provider approval. See [the free-only architecture audit](FREE_ONLY_ARCHITECTURE_AUDIT.md) for the stack review and official provider references.

## Completed and evidenced

| Gate | Current evidence | Status |
|---|---|---|
| Architecture, data model, API design, and CI | Repository design documents, Docker Compose, GitHub Actions CI | Complete as design/automation |
| Resume upload and PDF text extraction | Authenticated route, `unpdf` PDF extraction, input validation, Zod profile schema | Code complete |
| Structured resume parsing | Current `parse-resume.ts` calls the OpenAI Responses API | Implemented in source, **blocked under strict zero-spend**; no OpenAI key configured, no free/local replacement merged |
| Adaptive interview engine | Server-owned session state, branch/role question banks, follow-up and difficulty tests | Code complete; acceptance uses synthetic tests |
| Voice interaction | Browser Speech Recognition/Synthesis, interruption handling, typed fallback | Code complete; real-device latency, privacy behavior and weak-network acceptance pending |
| Live coding | Docker CLI adapter, hidden tests stay host-side, no-network container flags, resource/time limits and cleanup logic | Code and CI integration complete; production Docker-host/isolation acceptance pending |
| Fair evaluation | Deterministic evidence-oriented rubric, review-only integrity flags, repeated-score test | Code complete |
| Synthetic identity-invariance regression | 25 candidate-name/college metadata combinations compared to score baseline | Merged and CI-validated; not a population-level fairness study |
| Cohort dashboard | TPO authorization, cohort aggregation, small-group suppression, consent and pilot-code handling | Code complete; real authorised-account test pending |
| CI | Typecheck/unit tests, production build, container build, isolated sandbox integration tests and Playwright smoke tests | Passed for the recent implementation; run status must be read from GitHub Actions for this revision |
| Supabase project | Project `raaha-ai-mock-interview` is `ACTIVE_HEALTHY` on the Free tier in Mumbai; URL and publishable key configured in Render | Provisioned; login/redirect/access smoke test still pending |
| Render staging | `https://raaha-ai-mock-interview-free.onrender.com`; latest environment-triggered deployment became `LIVE` on commit `c5a58565f3f68d9fd4fa17e4846e682db29539ac` | Deployment live; rerun health and route smoke tests after the latest environment update |
| Supabase schema | No tables found in the public schema at the audit time | No custom persistent application schema evidenced |
| Free-only spend guard | No OpenAI key or paid API usage was enabled during the staging update | No paid provider configured; the current resume-parser path is consequently unavailable |

## Release blockers and free-only limitations

1. **Resume parsing under zero spend:** the existing parser still requires `OPENAI_API_KEY` to call OpenAI. Do not add that key under the user's strict free-only requirement. Implement and test a deterministic local parser and/or an explicitly opt-in free-provider adapter, with schema validation, quota handling, privacy review, and no paid fallback.
2. **Supabase Auth:** test email/password sign-in/sign-out, email confirmation, redirect URLs and 401/403 behavior on the current Render environment. Public URL/key configuration is not proof of successful login.
3. **Persistent data:** the Supabase project has no public tables. Do not claim durable resumes/profiles/transcripts until migrations, row-level security, write paths, retention/deletion and tests exist.
4. **Voice:** measure start-of-reply latency on real Android hardware and a weak network. Browser Speech Recognition can vary by browser/OS and is not proof of strictly on-device processing. The under-two-second target is not currently accepted.
5. **Code execution:** verify a dedicated Docker-capable worker on the intended host, pin the runner image, confirm timeout cleanup and no-network behavior, and run adversarial isolation tests. Docker tests in CI do not prove the Render container has a Docker daemon or provides a suitable production boundary.
6. **Partner college and consent:** obtain written partner approval, finalise notice/consent, configure pilot college/invite code/TPO authorization, and recruit ten actual consenting students. Synthetic cases do not count.
7. **Authenticated load test:** run `pnpm loadtest:dashboard` with an authorized TPO session and preserve non-secret parameters, deployment SHA, output, latency and error results. A local/synthetic load run is not a live load test.
8. **Fairness evidence:** the 25-case identity-metadata regression confirms a specific invariant in a synthetic test. It is not a population-level fairness study or hiring-validity assessment.
9. **Free service limits:** Supabase Free projects may pause after a week of low activity and have no automatic backups. Render Free Key Value has persistence disabled. Upstash/Gemini/Groq/Langfuse quotas are optional alternatives, not currently integrated services, and can change.

## Exact next steps

1. Test current Supabase login and protected-route behavior after the Render environment refresh.
2. Keep `OPENAI_API_KEY` blank. Build/test a local parser or a free-provider adapter that only calls a verified free model and fails closed on quota exhaustion. Never silently switch to paid usage.
3. Make a decision on persistent data requirements; add migrations and RLS only for data the product actually needs.
4. Provision a Docker-capable isolated execution host and finish hostile-code acceptance before enabling the coding round to public users.
5. Configure TPO/college access and a consented pilot only after partner agreement and privacy review.
6. Run the authenticated load test and voice-device test matrix; preserve reproducible evidence.
7. Do the 10-student pilot, review outcomes, and write the post-mortem based on observed data.

Never mark a blocked acceptance criterion complete because its implementation or synthetic test exists. "Free to use" does not mean unlimited, permanently available, fully open source, or approved for sensitive student data.
