# Decision Log

Decision: use a TypeScript-first monorepo with Next.js and PostgreSQL for the first production slice.

Options considered:
1. Next.js + TypeScript + PostgreSQL
2. React + FastAPI + PostgreSQL
3. Spring Boot + React + PostgreSQL

Why:
The first week needs fast feedback with clear service boundaries. TypeScript-first reduces integration overhead. Spring Boot remains a later extraction option if enterprise backend separation becomes useful.

Trade-off:
Prioritizes development speed and shared types over cross-language diversity.
