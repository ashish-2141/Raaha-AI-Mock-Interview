# Raaha AI Mock Interview

Day 2 implementation for authenticated sign-in and structured resume parsing.

## Stack

- Next.js 16.3.8
- React 19.3
- TypeScript 7
- Node.js 24 LTS
- pnpm 12.8
- Supabase Auth with @supabase/ssr 0.12.7
- PostgreSQL 18 + Prisma 8
- Redis 8.x
- OpenAI SDK 7.17 with Responses API structured parsing
- Zod 4
- unpdf 1.8.1
- Biome 2.5
- Vitest 5
- Playwright 1.57
- GitHub Actions

## Day 2 implementation

1. Email/password authentication with Supabase SSR and cookie-aware session refresh.
2. Protected PDF resume upload route.
3. PDF text extraction with unpdf.
4. Resume profile extraction with OpenAI structured output.
5. Zod validation for branch, CGPA, skills and projects.
6. Size/page limits for uploaded resumes.
7. Login and resume parser UI.
8. Auth callback route.
9. Unit tests, negative validation test and Playwright smoke coverage.

## Security baseline

- Resume text is wrapped in explicit delimiters and treated as untrusted data.
- AI output is rejected unless it passes the Zod schema.
- No raw resume persistence is performed by the Day 2 API.
- PDF input is limited to 5 MB and 10 pages.
- Secrets stay in environment variables.
- Candidate code execution remains isolated from the web process and is scheduled for later work.

## Run

```bash
pnpm install
pnpm dev
pnpm check
pnpm test:e2e
pnpm build
```

Required environment variables are documented in .env.example.