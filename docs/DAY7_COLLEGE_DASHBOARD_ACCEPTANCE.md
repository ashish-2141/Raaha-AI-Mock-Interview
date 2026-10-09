# Day 7: College dashboard acceptance and pilot readiness

## Implemented in this branch

- Authenticated `/college-dashboard` page and `GET /api/college-dashboard/summary` endpoint.
- TPO account-to-college authorization from server-side `RAAHA_COLLEGE_DASHBOARD_ACCESS_JSON`. The client cannot choose the college ID.
- Consent required before a voice interview starts.
- Optional pilot code validated on the server. Cohort association is assigned from `RAAHA_PILOT_COLLEGE_ID`, not from a client-supplied college field.
- Redis index for sessions enrolled in a pilot cohort.
- Aggregate metrics by branch and skill, including average score and weak-skill flags.
- Overall cohort suppression below five distinct consenting participants. Individual branch and skill group suppression below five distinct participants.
- Dashboard responses omit candidate IDs, individual answers and raw session records.
- Redis-based operational request metrics, structured application logs, and model token/cost accounting for resume parsing.
- Operator-only `GET /api/operations/summary` endpoint.
- Authenticated TPO dashboard load-test harness: `pnpm loadtest:dashboard`.

## Required server configuration

- `RAAHA_PILOT_COLLEGE_ID`: internal college identifier.
- `RAAHA_PILOT_INVITE_CODE`: secret invite code shared only with enrolled participants.
- `RAAHA_COLLEGE_DASHBOARD_ACCESS_JSON`: JSON map of allowed Supabase auth user IDs to internal college IDs.
- `RAAHA_OPERATIONS_ADMIN_USER_IDS`: comma-separated Supabase auth user IDs allowed to view operational metrics.
- `RAAHA_OPENAI_INPUT_USD_PER_1M` and `RAAHA_OPENAI_OUTPUT_USD_PER_1M`: token rates in USD per million tokens. Leave blank if rates are not approved. Calls without configured rates are reported as unknown-cost, not free.

Use the same college ID in the pilot configuration and the TPO access mapping. Keep invite codes, Supabase cookies and production URLs/credentials out of source control.

## Automated validation

The aggregate function has tests for the five-participant privacy threshold, suppressed subgroups and consent/college association. GitHub Actions must pass `pnpm check` and `pnpm build` before merge.

The load-test command requires a deployed base URL and an authorised TPO cookie supplied through environment variables. It records request statuses and p50/p95/max latency. Run it only against the deployment and request rate approved for testing. Save the JSON output with the deployment version and test window.

## Still requires real deployment and external access

- Set the production Supabase, Redis and OpenAI configuration in the hosting provider.
- Configure the pilot college, invite code, TPO access map and operational admin IDs.
- Deploy the branch to a production-like environment and record its actual URL.
- Run the authenticated load test and retain the results.
- Ask a partner college to approve the pilot and invite 10 real students. Obtain their informed consent and confirm the privacy notice before collecting pilot data.
- Record actual participation, completion rate, latency, errors, cost and feedback. Write the post-mortem from those observations.

Synthetic test fixtures only validate the aggregation function. They do not count as student participation. No live deployment, external APM vendor, or 10-student pilot is claimed by this document.
