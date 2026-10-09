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

The sandbox now creates a uniquely named container, uses a non-root runtime, enforces CPU/memory/process/file-descriptor limits, disables network access, makes the root filesystem read-only, and force-removes the container in a `finally` path even when the attached execution command times out. The Docker integration suite covers a valid solution, an incorrect solution, and infinite-loop timeout/cleanup. CI runs those integration tests on a Docker-capable runner using the public ECR Node image.

## Acceptance boundary

A deployment must provide a Docker-capable host and a pinned sandbox image. A real browser/device E2E run is still required before calling the weekly feature production-accepted.