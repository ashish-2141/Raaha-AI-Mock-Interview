# Raaha AI Mock Interview

Day 3 implementation adds an adaptive interview engine on top of the Day 2 authentication and resume parsing foundation.

## Stack

- Next.js 16.3.8
- React 19.3
- TypeScript 7
- Node.js 24 LTS
- pnpm 12.8
- Supabase Auth
- PostgreSQL 18 + Prisma 8
- Redis 8.x + node-redis 6.3
- LangGraph.js 1.4.18
- OpenAI Responses API
- Zod 4
- Vitest 5
- Playwright 1.57
- Biome 2.5
- GitHub Actions

## Day 3 feature

The engine runs an explicit evaluate -> question graph.

It uses:
- Resume project context
- Role and branch context
- Last 3 turns verbatim
- Older-turn compression
- Anti-repetition
- Follow-up probing for vague answers
- Difficulty adjustment from 1-5
- Redis persistence utility for interview state

## Test coverage

- Resume-grounded opening question
- Vague answer -> follow-up
- Strong answer -> higher difficulty

Run:

```bash
pnpm install
pnpm check
```

The real-model adapter remains provider-configurable. Keep API keys in environment variables.