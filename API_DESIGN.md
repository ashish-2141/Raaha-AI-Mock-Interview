# API Design, Day 2

## Authentication

Supabase Auth provides email/password authentication. Browser sessions use @supabase/ssr and the Next.js proxy refreshes auth cookies.

## POST /api/resumes/parse

Authentication: required.
Content type: multipart/form-data.
Field: file, PDF only.

Validation limits:
- 5 MB maximum file size.
- 10 pages maximum.
- 50,000 extracted characters maximum sent to the model.

Processing:
1. Resolve the authenticated Supabase user.
2. Read the multipart file.
3. Validate MIME type, size and page count.
4. Extract text with unpdf.
5. Send text to the OpenAI Responses API with a Zod-backed structured-output schema.
6. Validate the parsed result again with ResumeProfileSchema.
7. Return the validated profile.

The route does not persist the raw PDF or unvalidated model output.