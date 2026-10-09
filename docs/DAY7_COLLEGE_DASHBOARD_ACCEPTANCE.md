# Day 7: College dashboard acceptance plan

## Status
This is a planning and acceptance artifact, not proof of a production deployment or real-student pilot.

Repository: https://github.com/ashish-2141/Raaha-AI-Mock-Interview
Week 1 plan: College dashboard by Friday, with cohort weak areas by branch and skill, monitoring/logs/cost tracking, load test, then a pilot with 10 students.

## Verified code state at review time
- PR #1 modern-stack scaffold: merged.
- PR #2 sign-in and resume parsing: merged.
- PR #3 adaptive interview engine: merged.
- PR #4 voice interview slice: merged.
- PR #5 secure live-coding round: merged.
- PR #6 fair scoring and anti-cheat signals: open, mergeable, not yet on main.
- The main landing page remains an architecture scaffold.
- No production deployment URL or partner-college dashboard access is established by repository evidence.

## Dashboard minimum viable scope
1. TPO authentication and college-scoped access.
2. Cohort summaries by branch and skill, not candidate-level answer disclosure by default.
3. Clear aggregate sample sizes and suppress small groups to avoid identifying students.
4. Data freshness and session count.
5. Error rate, latency, and model/provider cost indicators.
6. Accessible mobile layout and loading/empty/error states.
7. Export only aggregated data under the college's permissions.

## Required integration work
- Review PR #6 and require CI success before merge.
- Connect the fair scoring breakdown to the adaptive interview turn pipeline while preserving the existing 1–5 qualityScore contract.
- Persist evaluation outcomes with ownership/college relationship and strict authorization.
- Build and test the TPO dashboard against permitted aggregate data.
- Add operational metrics and structured logs without logging resumes, secrets, tokens, or full candidate answers.
- Configure deployment secrets through the hosting provider, not committed files.
- Validate health, auth, resume parsing, adaptive turns, voice fallback, coding sandbox and dashboard on a production-like host.
- Run a repeatable load test and store the results with test configuration.
- Invite 10 real students only after consent, privacy notice, access control, and safety checks are in place.
- Produce the one-page post-mortem only after actual pilot observations are collected.

## Pilot record template
| Field | Value |
|---|---|
| Pilot date/window | Pending |
| Partner college | Pending |
| Student participants | 0 evidenced |
| Consent and privacy notice | Pending |
| Sessions attempted/completed | Pending |
| Completion rate | Pending |
| p50/p95 response latency | Pending |
| Error rate | Pending |
| Cost per completed session | Pending |
| Student feedback themes | Pending |
| Critical bugs | Pending |
| Decision | Do not claim pilot complete yet |

## Release acceptance checklist
- [ ] PR #6 reviewed and CI green.
- [ ] Scoring integration tests pass.
- [ ] College tenant isolation tests pass.
- [ ] Dashboard empty, populated, loading and error states tested.
- [ ] Small cohorts are suppressed.
- [ ] Logging and cost instrumentation verified.
- [ ] Load-test results recorded.
- [ ] Production-like deployment URL and health check verified.
- [ ] 10 real participants complete a consented pilot.
- [ ] Post-mortem based on observed results.

## Release decision
Not production-ready from the available evidence. The scoring PR, authenticated aggregate dashboard, persistence/authorization, monitoring, deployment, load results and real student pilot remain release gates. Do not substitute synthetic rows or a static prototype for those acceptance criteria.
