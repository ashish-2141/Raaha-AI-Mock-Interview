# Stack Decision, October 2026

| Layer | Selection | Day 2 role |
|---|---|---|
| Full-stack | Next.js 16.3.8 + React 19.3 | App Router UI and route handlers |
| Language | TypeScript 7 | Shared static types |
| Auth | Supabase Auth + @supabase/ssr 0.12.7 | Cookie-based sessions |
| AI | OpenAI SDK 7.17 + Responses API | Structured resume extraction |
| PDF | unpdf 1.8.1 | Server-side text extraction |
| Validation | Zod 4 | Schema validation at trust boundaries |
| Database | PostgreSQL 18 + Prisma 8 | Persistence layer prepared for later profile storage |
| Cache | Redis 8.x | Reserved for interview/session state |
| Tests | Vitest 5 + Playwright 1.57 | Unit and browser smoke coverage |
| Quality | Biome 2.5 + GitHub Actions | Formatting, linting and CI |
