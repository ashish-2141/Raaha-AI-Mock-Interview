# Raaha AI Mock Interview

Production-oriented Day 1 foundation for the Raaha AI mock interview platform.

## Stack

- Next.js 16.3.8
- React 19.3
- TypeScript 7
- Node.js 24 LTS
- pnpm 12.8
- Tailwind CSS 4.3
- PostgreSQL 18
- Prisma ORM 8
- Redis 8.x
- Zod 4
- Biome 2.5
- Vitest 5
- Playwright 1.57
- GitHub Actions

## Day 1 scope

- Architecture and system design
- Data model
- API design
- Stack decision and trade-offs
- Repository quality gates
- Next.js App Router application shell
- Health endpoint
- Runtime schema validation
- Prisma data model starter
- Unit and E2E testing setup

## Commands

```bash
pnpm install
pnpm dev
pnpm check
pnpm test:e2e
pnpm build
```

## Security baseline

- Treat AI output as untrusted until Zod validation succeeds.
- Never execute candidate code inside the Next.js process.
- Keep provider SDK types outside domain models.
- Never commit secrets or production connection strings.
- Add authentication, rate limiting, audit logging and request IDs before production APIs.