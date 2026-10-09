# Day 5 - Live Coding Round

The Day 5 live-coding slice now exists in the working repository.

## What is implemented

- Browser route: /live-coding
- Authenticated execution API: /api/coding/execute
- Public challenge metadata endpoint without hidden tests
- Hidden server-side test cases
- Source-size and escape-token checks
- Separate Docker execution boundary
- Network-disabled container
- Read-only root filesystem and read-only source mount
- Dropped Linux capabilities and no-new-privileges
- Memory, CPU and PID limits
- Aggregate pass/fail result plus case timing
- Deterministic solution-review feedback

The sandbox creates a uniquely named container, uses a non-root runtime, enforces CPU/memory/process/file-descriptor limits, disables network access, makes the root filesystem read-only, and force-removes the container in a `finally` path even when an execution command times out. Only `solution.mjs` is mounted into the candidate container. Hidden case lists and expected outputs remain in the host process; the container receives only the current test input, and the host compares the returned result against the expected value. Optional structured AI code review (summary, time complexity, space complexity, strengths and improvements) is available only when `RAAHA_AI_CODE_REVIEW_ENABLED=true` and an OpenAI key is configured. It is disabled by default to avoid API usage; the provider receives the public problem statement, submitted source and aggregate pass count, never hidden test cases. The Docker integration suite covers a valid solution, an incorrect solution, and infinite-loop timeout/cleanup. Unit tests validate the optional code-review schema and assert that hidden test cases are not part of the review input. CI runs those integration tests on a Docker-capable runner using the public ECR Node image.

## Acceptance boundary

A deployment must provide a Docker-capable host and a pinned sandbox image. A real browser/device E2E run is still required before calling the weekly feature production-accepted.