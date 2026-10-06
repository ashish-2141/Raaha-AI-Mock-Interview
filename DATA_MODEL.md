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
