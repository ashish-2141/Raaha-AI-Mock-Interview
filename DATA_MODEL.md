# Data Model

```
User 1---1 StudentProfile
StudentProfile 1---* Resume
StudentProfile 1---* InterviewSession
InterviewSession 1---* InterviewTurn
InterviewSession 1---* CodingAttempt
InterviewSession 1---1 Evaluation
Evaluation 1---* Evidence
StudentProfile *---* Skill
```

Core entities:
- User
- StudentProfile
- Resume
- InterviewSession
- InterviewQuestion
- InterviewTurn
- CodingAttempt
- Evaluation
- Evidence
- Skill

Invariants:
- Every interview belongs to exactly one student.
- Turn sequence numbers are monotonic.
- Scores reference evidence from the student's answer/code.
- Provider output is schema-validated before persistence.

## Physical versus conceptual model

The relationships above describe the intended durable data model. They are **not all implemented as PostgreSQL tables yet**.

Current persistence:
- Active interview turns and session state live in Redis with a 24-hour inactivity TTL.
- Consented college-cohort sessions are indexed in Redis and are only aggregated into threshold-protected TPO results.
- A successfully parsed resume profile is stored in the current browser tab's sessionStorage to carry it into interview setup; the parsed profile is not yet written to durable PostgreSQL storage.
- Prisma currently defines the InterviewSession and InterviewTurn models, but the request paths still use Redis for active interview state; the Prisma models are not proof that database writes/migrations are wired.

Before production use, implement and review migrations for user/profile/resume ownership, consent/retention fields, turn/evaluation evidence, indexes and deletion behavior. Add route-level persistence tests against a provisioned test database, plus authorization tests ensuring one user cannot fetch another user's records. A real DATABASE_URL and an approved persistence/retention policy are required to validate this path; no database credentials or production records should be invented for the free staging environment.
