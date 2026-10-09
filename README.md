# Raaha AI Mock Interview

Day 4 extends the Day 3 adaptive interview engine with a real-time voice interview slice.

Day 3:
- Adaptive evaluate -> question graph
- Resume, role and branch context
- Follow-up probing and difficulty adjustment
- Anti-repetition
- Redis persistence utility

Day 4:
- Browser speech input with SpeechRecognition
- Speech output with SpeechSynthesis
- POST /api/interview/voice/start
- POST /api/interview/voice/turn
- Explicit interruption handling
- Text fallback for unsupported voice input
- Deterministic local fallback for network/API failure
- Latency instrumentation

The voice layer is provider-agnostic. Production speech-provider integration can be added later without changing the interview-state API.

Run:
pnpm install
pnpm check
pnpm build

Required environment for voice API execution:
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
REDIS_URL

The Android weak-network under-2-second acceptance target is not claimed until measured on a real device and connection.
Prisma uses the published 7.10.0 release in the current CI-compatible dependency set.

## College dashboard and pilot setup

The authenticated TPO dashboard is available at `/college-dashboard`. It returns cohort-level aggregates only. Individual answers and candidate identifiers are not returned. The overall cohort is suppressed until at least five consenting participants contribute. Each displayed branch and skill group independently needs five distinct participants.

To enable a single college pilot on a deployment, configure these server-side variables:

- `RAAHA_PILOT_COLLEGE_ID`: an internal college identifier.
- `RAAHA_PILOT_INVITE_CODE`: a strong invite code shared only with enrolled participants.
- `RAAHA_COLLEGE_DASHBOARD_ACCESS_JSON`: JSON map of authorised Supabase user IDs to the college IDs they may view, for example `{"<TPO_USER_UUID>":"<college-id>"}`.

Participants must accept the consent notice before starting an interview. Entering a valid pilot code associates the session with the configured college. Pilot code and college ID are checked on the server. Interview session data is kept in Redis with a 24-hour inactivity TTL. The cohort dashboard skips expired sessions and keeps small groups hidden.

The dashboard requires a reachable Redis service, Supabase authentication, valid pilot configuration, and a partner-college TPO account mapped by the operator. Do not describe it as deployed or piloted until those environment settings and real participant sessions are verified.

## Dashboard load test

After deployment, run the authenticated dashboard load test from an operator environment:

```sh
RAAHA_LOAD_TEST_BASE_URL=https://your-deployment.example \
RAAHA_LOAD_TEST_COOKIE='your-authorised-tpo-session-cookie' \
RAAHA_LOAD_TEST_REQUESTS=100 \
RAAHA_LOAD_TEST_CONCURRENCY=10 \
pnpm loadtest:dashboard
```

The script reports status counts, requests per second, p50/p95/max latency, and failures. Store the output alongside the deployment version and test window. Keep the cookie in an environment variable, never in source control or a report.

Operations summaries are restricted to IDs in `RAAHA_OPERATIONS_ADMIN_USER_IDS`. Token-cost tracking requires configured per-million-token rates. If rates are absent, cost is recorded as unknown, not zero.

## Self-hosted Docker deployment

A Docker Compose deployment path is included for a Linux host with Docker Engine and the Compose plugin. It runs the Next.js app and Redis, keeps Redis private on the Compose network, and binds the app to `127.0.0.1:3000` by default. Put a TLS reverse proxy in front of it for public HTTPS traffic.

Read [the deployment runbook](docs/DEPLOYMENT_RUNBOOK.md) before starting. Copy `.env.example` to `.env`, configure Supabase and OpenAI, set the final HTTPS origin in `NEXT_PUBLIC_APP_URL` before the image build, then run:

```sh
docker compose config
docker compose up --build -d
docker compose ps
curl -fsS http://127.0.0.1:3000/api/health
```

Do not commit the `.env` file. The public Supabase values are passed as Docker build arguments because Next.js embeds `NEXT_PUBLIC_*` values into the browser bundle. Server secrets remain runtime environment variables. The deployment is not considered production-accepted until the actual host, URL, health check, TPO mapping, load test and consented 10-student pilot are verified.

## Render deployment setup

The repository also includes `render.yaml` for a **free-tier Render staging setup**: a Docker web service and private Key Value instance in Singapore, with deployment after GitHub checks pass. Free web instances sleep after inactivity and may restart; free Key Value does not persist data. Treat it as a smoke-test environment only, not production or a college pilot. Keep both services on the Free plan and do not enable paid add-ons.

For the launch sequence, secret inputs, TPO mapping, privacy checks and real pilot steps, follow [the Render launch checklist](docs/RENDER_LAUNCH_CHECKLIST.md). The first deployment requires a Render account connected to this GitHub repository and your Supabase/OpenAI secrets. The repository itself does not confirm that the services have been provisioned or that a public URL is live.
