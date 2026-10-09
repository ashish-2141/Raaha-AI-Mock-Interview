# Weekly Coding Tasks: Acceptance Matrix

**Reviewed against:** `main` at `8de1169abcddbc359129163d2d7d3abefe3bb132` before this change set; the PR that updates this matrix adds the linked user journey, opt-in AI paths, and deeper CI tests. Update the commit and CI links after merge.

This matrix distinguishes implementation from the plan's measurable acceptance evidence. CI fixtures, a successful health check, and documentation do not count as real-user acceptance.

| Plan day | Required coding feature | Repository evidence | Status |
|---|---|---|---|
| Sat 3 Oct | Architecture diagram/design, data model, API design, stack trade-offs, lint/tests/CI from first commit | `ARCHITECTURE.md`, `DATA_MODEL.md`, `API_DESIGN.md`, `STACK_DECISION.md`, new `SYSTEM_DESIGN.md`, GitHub Actions CI | **Implemented/docs drafted.** Manager approval is still external; durable PostgreSQL persistence is not wired into the user journey. |
| Sun 4 Oct | Sign-in and PDF resume upload; structured profile with skills, projects, branch and CGPA; 10 real resumes and fewer than 10% field errors | `src/app/login/page.tsx`, `src/app/api/resumes/parse/route.ts`, `src/lib/resume/*`, `test/resume-schema.test.ts`, `docs/DAY2_RESUME_VALIDATION.md` | **Code implemented; real-data acceptance pending.** Schema tests use 10 synthetic profiles, not 10 real resumes. Hosted Supabase/OpenAI configuration is absent. |
| Mon 5 Oct | Adaptive interview questions from resume/role/branch; follow-up questions; difficulty increases/decreases; 3 test interviews | `src/lib/interview/graph.ts`, `questions.ts`, `fair-scoring.ts`, `test/adaptive-interview.test.ts`, optional `src/lib/interview/ai-question.ts` | **Core behavior and automated tests implemented.** Rule-based generation remains the no-cost default; model-backed question generation is opt-in and has not been live-tested. |
| Tue 6 Oct | Browser voice conversation, interruption, phone operation, reply begins under 2 seconds on weak connection | `src/app/voice-interview/page.tsx`, `src/lib/voice/*`, voice API routes, `test/voice-interview.test.ts` | **Browser voice/text slice implemented.** Real Android/weak-network latency is not measured. Browser SpeechRecognition/SpeechSynthesis is not the same as a managed full-duplex streaming service. |
| Wed 7 Oct | Browser coding editor, isolated execution, hidden test cases, AI review of approach, complexity and code quality | `src/app/live-coding/page.tsx`, `src/lib/coding/*`, sandbox integration test, opt-in `src/lib/coding/review.ts` | **Code and integration tests added.** Docker-backed execution must pass CI. The free Render service does not provide a Docker daemon, so this hosted staging instance cannot claim live code execution. Model code review is off by default and requires explicit consent. |
| Thu 8 Oct | Fair rubric with answer evidence; same answer scored 5 times varies no more than one point; bias and injection tests | `src/lib/interview/fair-scoring.ts`, `test/fair-scoring-anti-cheat.test.ts`, `docs/DAY6_FAIR_SCORING_ANTI_CHEAT.md` | **Deterministic scoring and regression tests implemented.** Automated five-run consistency is covered. A human-reviewed diverse benchmark and complete bias assessment remain pending. Anti-cheat flags are review-only, not proof of cheating. |
| Fri 9 Oct | TPO dashboard, cohort weak-skill insights by branch, monitoring/logs/cost tracking, authenticated load test and 10-student pilot | `src/app/college-dashboard/*`, `src/lib/dashboard/*`, `src/lib/ops/metrics.ts`, `scripts/load-test-dashboard.mjs`, `docs/DAY7_COLLEGE_DASHBOARD_ACCEPTANCE.md` | **Code deployed to free staging; health and Redis smoke test passed.** Supabase authentication and TPO access are not configured. Authenticated load test, partner approval, ten distinct consenting students, and evidence-based post-mortem remain pending. |

## Further acceptance gates

- [ ] Manager approval recorded for `SYSTEM_DESIGN.md`.
- [ ] Run the current branch CI and retain success for type checks, all unit tests, production build, browser E2E tests, Docker build and Docker sandbox integration tests.
- [ ] Configure real Supabase credentials privately, then test registration, email confirmation and sign-in on the deployed service.
- [ ] Parse ten real, consented PDFs against human-reviewed ground truth and calculate field-level error rate.
- [ ] Test at least 30 voice turns on a named Android device/network profile; report median/p95/max and failures against the under-two-second reply-start target.
- [ ] Run infinite-loop and other hostile coding submissions on a pinned sandbox image on a Docker-capable runtime; inspect container cleanup and verify network restrictions.
- [ ] Review scoring with a human-labelled answer set across varied answer quality and irrelevant name/college changes; expand injection test cases.
- [ ] Run the authenticated TPO load test at approved concurrency and keep the JSON output, deployed commit and time window.
- [ ] Obtain written college approval and final consent notice, then run the pilot with ten real, distinct, consenting students.
- [ ] Complete the post-mortem using real participation, latency, error, cost and feedback measurements.

No pending item above is satisfied by synthetic fixtures, a model-disabled fallback, a successful compile alone, or a health check.
