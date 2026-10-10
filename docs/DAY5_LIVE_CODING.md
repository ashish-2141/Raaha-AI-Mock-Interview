# Day 5 - Live Coding Round

The Day 5 live-coding slice now exists in the working repository.

## What is implemented

- Browser route: /live-coding
- Authenticated execution API: /api/coding/execute
- Public challenge metadata endpoint without hidden tests
- Hidden server-side test cases
- Source-size and escape-token checks
- Separate Docker execution boundary, one hidden case per short-lived container
- Expected answers and the remaining hidden cases stay in the host process and are not mounted into the candidate environment
- Network-disabled container
- Read-only root filesystem and read-only source mount
- Dropped Linux capabilities and no-new-privileges
- Memory, CPU and PID limits
- Non-root runtime user, read-only mounts, one-second stop timeout, container-ID tracking and explicit kill after host timeout
- CI integration tests run a correct solution against all hidden cases and verify an infinite-loop submission is terminated
- Aggregate pass/fail result plus case timing
- Deterministic solution-review feedback

## Acceptance boundary

CI runs the sandbox runtime integration test against the public Node image mirror. The challenge image can be pinned using `RAAHA_SANDBOX_IMAGE`; the current default is the moving `24-alpine` tag, not a digest, so digest pinning remains a production hardening item. A real browser/device E2E run and adversarial attempts to reach the host filesystem or network are still required before calling the weekly feature production-accepted.