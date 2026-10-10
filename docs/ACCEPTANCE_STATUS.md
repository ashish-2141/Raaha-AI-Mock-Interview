# Raaha acceptance status

Updated: 2026-10-10

This report separates code-level completion from acceptance that requires real credentials, devices, operators, or participants.

## Completed and evidenced

| Gate | Current evidence | Status |
|---|---|---|
| Architecture, data model, API design, and CI | Repository design documents, Docker Compose, GitHub Actions CI | Complete |
| Resume upload and structured parsing code | Zod schema, PDF extraction and parser, synthetic fixture validation | Code complete; real-resume acceptance pending |
| Adaptive interview engine | Server-owned session state, branch/role question banks, follow-up and difficulty tests | Code complete |
| Voice interaction | Browser speech recognition/synthesis, interruption handling, typed fallback | Code complete; real-device latency acceptance pending |
| Live coding | Hidden tests in server process, isolated Docker execution adapter, resource limits, no network, timeout cleanup | Code and CI integration complete; production sandbox host validation pending |
| Fair evaluation | Evidence-based rubric, review-only integrity flags, repeated-score test | Code complete |
| Synthetic identity-invariance regression | 25 candidate-name/college metadata combinations, with score output compared to baseline | Merged and CI-validated |
| Cohort dashboard | TPO authorization, cohort aggregation, small-group suppression, consent and pilot-code handling | Code complete; real authorized-account test pending |
| Main CI | Type check/unit tests, production build, container build, isolated sandbox integration tests, Playwright smoke tests | Passed for the recent implementation; latest main workflow linked in GitHub Actions |
| Staging dependency health | Free Render deployment and /api/health smoke workflow previously returned HTTP 200 with Redis healthy | Health evidence exists; public route smoke coverage is being added |

## Release blockers that require external participation or secrets

1. Supabase: no Supabase projects were available through the connected account during this review. The deployment needs an approved project URL and publishable key. Configure them directly in Render, never in source control.
2. OpenAI: resume extraction needs an approved API key. A valid key can incur usage charges. Do not run billable API tests until an owner approves the model and spend limit. Add the key directly in Render secret environment settings.
3. Real-device voice latency: measure start-of-reply latency on an actual phone and a weak network. CI browser tests do not establish the under-two-second target.
4. Code-execution production isolation: validate a dedicated Docker worker on the intended host, pin the runtime image by digest, observe timeout cleanup, and run adversarial isolation tests. The free web container is staging only.
5. Partner college and consent: obtain partner approval, finalize the notice, configure college ID/invite code/TPO authorization, and recruit ten real consenting students. Synthetic users do not count.
6. Authenticated load test: run the dashboard harness against the configured deployment with an authorized TPO session and preserve the output.
7. Bias study: the 25-case regression verifies identity metadata is not used by the deterministic scoring function. It is not a population-level fairness study. Before high-stakes use, evaluate a reviewed multi-question answer set across approved groups and document disparities and human review.

## Exact operator sequence

1. Configure Supabase URL/publishable key in Render using a verified project.
2. Add an OpenAI key only after explicit cost approval and set approved input/output token rates for cost tracking.
3. Redeploy, sign in, test resume parsing and verify unauthorized dashboard access returns 403.
4. Provision and validate an isolated sandbox worker; do not enable candidate code execution on a host that lacks this boundary.
5. After partner approval, configure the TPO access map and pilot invite code in Render.
6. Run authenticated load test, then conduct the 10-student consented pilot.
7. Record actual latency, completion rate, errors, cost and feedback. Write the post-mortem from observed results.

Never mark a blocked acceptance criterion complete because its implementation or synthetic test exists.
