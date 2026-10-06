# API Design, Day 1

## Health

GET /api/health

Returns a small JSON payload for uptime checks and deployment verification.

## Planned domain APIs

POST /api/interviews
Creates an interview session after candidate identity and role validation.

POST /api/interviews/:id/turns
Accepts an answer, evaluates the turn, stores evidence, and returns the next question plus updated difficulty.

POST /api/resumes/parse
Accepts a resume document, extracts text, validates a structured profile, and stores only validated fields.

POST /api/code/execute
Queues code execution to the isolated sandbox. The web tier never executes candidate code directly.

GET /api/interviews/:id/report
Returns evidence-backed scoring and the interview summary.

## API rules

- Validate request bodies with Zod.
- Use typed domain objects instead of provider response types.
- Return stable error codes.
- Keep request identifiers and interview identifiers in logs.
- Apply authentication and rate limits before production exposure.
