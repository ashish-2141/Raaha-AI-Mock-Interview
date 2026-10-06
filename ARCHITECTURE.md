# Architecture

```
                         +----------------------+
                         |      Next.js 16      |
                         | App Router / RSC /   |
                         | Route Handlers       |
                         +----------+-----------+
                                    |
               +--------------------+--------------------+
               |                    |                    |
               v                    v                    v
        Interview API        Resume pipeline       Portfolio API
               |                    |                    |
               v                    v                    v
        Orchestrator          Parser + Zod         Evidence store
               |
        +------+------+
        |             |
        v             v
   LLM adapter    Voice adapter
        |             |
        +------+------+
               |
               v
           PostgreSQL 18
               ^
               |
       Prisma ORM 8
               |
               +-------------------+
               |                   |
               v                   v
           Redis 8.x        Sandbox queue
                                   |
                                   v
                         Dedicated Docker runner
                         CPU / memory / PID / time
                         / network isolation
```

## Trust boundaries

1. Candidate input is untrusted.
2. Model output is untrusted until schema validation.
3. Candidate code is fully untrusted and isolated from the application process.
4. Redis holds ephemeral state. PostgreSQL remains the source of truth.
5. Provider adapters isolate model and voice vendors from domain logic.
