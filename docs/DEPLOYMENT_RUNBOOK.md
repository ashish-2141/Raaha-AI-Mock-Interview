# Raaha AI Mock Interview: deployment runbook

## Status

The application now has a Docker Compose deployment path. This is not proof of a live public deployment. The repository does not currently define a hosted production URL, and a production deployment requires the operator's server, DNS/TLS, Supabase and OpenAI configuration.

## 1. Prepare the runtime

Requirements:
- A Linux host with Docker Engine and the Docker Compose plugin.
- A domain name and TLS reverse proxy for public production use.
- A Supabase project with email/password auth configured.
- An OpenAI API key for resume parsing.
- An authorised TPO Supabase user ID and a college partner before enabling the pilot.

Do not expose port 3000 directly to the public internet. The Compose file binds it to 127.0.0.1 by default. Put a TLS reverse proxy in front of it.

## 2. Configure secrets

From the repository root:

```sh
cp .env.example .env
```

Fill in the required values:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_APP_URL`, set this to the final HTTPS origin before building, because `NEXT_PUBLIC_*` values are embedded in the browser bundle at build time.

Optional:
- `DATABASE_URL`, where applicable to the configured database.
- `RAAHA_PILOT_COLLEGE_ID`, an internal ID for one pilot college.
- `RAAHA_PILOT_INVITE_CODE`, a randomly generated secret shared only with invited students.
- `RAAHA_COLLEGE_DASHBOARD_ACCESS_JSON`, a JSON object mapping each permitted TPO's Supabase auth user ID to the same college ID.
- `RAAHA_OPERATIONS_ADMIN_USER_IDS`, comma-separated Supabase auth user IDs permitted to read operational metrics.
- `RAAHA_OPENAI_INPUT_USD_PER_1M` and `RAAHA_OPENAI_OUTPUT_USD_PER_1M`, approved rates in USD per million tokens. Leave them blank when the rates are not known; costs are then reported as unknown, not zero.
- `RAAHA_BIND_ADDRESS`, which defaults to `127.0.0.1`. Only change this when the host firewall and reverse proxy are configured to protect the service.

Generate an invite code on the host instead of writing it in source control:

```sh
openssl rand -hex 32
```

Example access map (replace placeholders before saving to the private `.env` file):

```json
{"<TPO_SUPABASE_USER_UUID>":"<internal-college-id>"}
```

Never commit `.env`, invite codes, Supabase session cookies or API keys. The `.dockerignore` excludes local environment files from the build context.

## 3. Build and start

```sh
docker compose config
docker compose up --build -d
docker compose ps
docker compose logs --tail=100 app
```

Check the local health endpoint:

```sh
curl -fsS http://127.0.0.1:3000/api/health
```

The health endpoint verifies Redis connectivity. An `ok` response does not prove that Supabase auth or the OpenAI API is correctly configured. Test sign-in and resume parsing after deployment.

## 4. Configure the college dashboard and invitees

- Create or identify the partner college and set `RAAHA_PILOT_COLLEGE_ID`.
- Add the authorised TPO Supabase user ID to `RAAHA_COLLEGE_DASHBOARD_ACCESS_JSON`, mapping it to the same college ID.
- Add operational administrators to `RAAHA_OPERATIONS_ADMIN_USER_IDS`.
- Restart/rebuild after changing environment variables. Public `NEXT_PUBLIC_*` values require rebuilding the container.
- Share the invite code only after the partner college approves the pilot and participants receive the consent notice.

The dashboard hides the cohort until five distinct consenting users have contributed, and hides any branch or skill subgroup smaller than five. Individual candidate answers and IDs are not included in TPO dashboard results.

## 5. Run the authenticated load test

After HTTPS is configured, sign in as the authorised TPO in a browser and provide that session cookie to the load-test script through an environment variable. Do not paste session cookies into source code or public reports.

```sh
RAAHA_LOAD_TEST_BASE_URL=https://your-domain.example \
RAAHA_LOAD_TEST_COOKIE='your-authorised-tpo-session-cookie' \
RAAHA_LOAD_TEST_REQUESTS=100 \
RAAHA_LOAD_TEST_CONCURRENCY=10 \
pnpm loadtest:dashboard
```

The script records HTTP status counts, throughput, p50/p95/max latency, and failures. Save the JSON output, deployment revision and test window. A load test against a local mock or an unauthenticated endpoint does not satisfy production acceptance.

## 6. Complete the real pilot

1. Obtain written partner-college approval and final privacy/consent wording.
2. Invite 10 actual students using distinct authenticated accounts.
3. Confirm each participant opts in before starting.
4. Observe and log failed starts, abandoned sessions, completion rates, latency, errors, approximate token cost and qualitative feedback.
5. Export only aggregate dashboard metrics. Do not include raw answers or student identifiers in the manager report.
6. Write a one-page post-mortem after the pilot ends, using the actual observations.

Synthetic unit-test fixtures are not student participation. Do not claim the 10-student pilot, load test or post-mortem complete until the corresponding evidence exists.

## 7. Rollback

To stop the application:

```sh
docker compose down
```

This leaves the named Redis volume in place. For a full reset, back up any required records, then remove `redis_data` explicitly. Removing the volume deletes stored session and metrics data.
