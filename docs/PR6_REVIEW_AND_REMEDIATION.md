# Pull Request 6 review notes and required fixes

PR: https://github.com/ashish-2141/Raaha-AI-Mock-Interview/pull/6
Status at 2026-10-09 review: open. Automated code review reported outstanding correctness and integration issues. Do not merge on the basis of the successful Devin Review status alone.

## Blocking findings

1. Wire fair scoring into real interview turns. The text and voice routes call `advanceInterview`, whose graph still calls the legacy `evaluateAnswer`. The new endpoint is standalone, so ordinary sessions do not receive its score breakdown or integrity flags.
2. Do not accept client-controlled integrity history/timing. The API currently accepts `previousAnswers` and `responseDurationMs` from the request. These values must derive from server-owned session state and server timestamps.
3. Fix substring false positives. Marker matching must use token/phrase boundaries so text such as `different` does not match `if`, and `rapid` does not match `api`.
4. Handle blank responses consistently. A blank response currently yields total 0 but qualityScore 1. Reject blanks at the API boundary or explicitly return 0 per the graph contract.
5. Add regression tests for marker boundaries, blank answers, live graph integration, and anti-cheat using authoritative server state.
6. Update DECISION_LOG.md for this architecture change.
7. Align documentation and returned schema. The document claims a separate 0-100 evidence score, while the API exposes a weighted total. Either return the documented field with a clear definition or correct the documentation.

## Suggested validation
- `pnpm check`
- `pnpm build`
- Text and voice turn integration tests.
- Repeated-answer test using server-held answer history.
- Timing-signal test driven by server-recorded duration, never a request parameter.
- Confirm integrity flags are review-only and do not silently lower candidate scores.

## Merge gate
Resolve the review threads and obtain green required CI before merge. Keep the integrity signals non-punitive and disclose that lexical indicators are heuristics, not proof of cheating.
