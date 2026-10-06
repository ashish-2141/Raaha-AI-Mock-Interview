# Engineering Rules

- Use server components by default. Add client components only when browser state or interaction requires them.
- Keep domain logic framework-independent where practical.
- Validate external input and AI output with Zod before persistence.
- Never execute candidate code in the Next.js process.
- Do not place provider-specific SDK types in domain models.
- Every feature must include tests and update the decision log when architecture changes.
- Never commit secrets, API keys, session tokens or production connection strings.
