import { z } from "zod";

export const CodingLanguageSchema = z.literal("javascript");
export type CodingLanguage = z.infer<typeof CodingLanguageSchema>;

export const CodingExecutionRequestSchema = z.object({
  challengeId: z.string().min(1).max(80),
  language: CodingLanguageSchema,
  source: z.string().min(1).max(20_000),
  aiReviewConsentAccepted: z.boolean().optional().default(false),
});

export const CodingCaseResultSchema = z.object({
  caseNumber: z.number().int().positive(),
  passed: z.boolean(),
  durationMs: z.number().nonnegative(),
  error: z.string().optional(),
});

export type CodingExecutionRequest = z.infer<typeof CodingExecutionRequestSchema>;