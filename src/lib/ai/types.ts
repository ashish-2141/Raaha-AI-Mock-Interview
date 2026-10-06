import { z } from "zod";

export const interviewTurnSchema = z.object({
  interviewId: z.uuid(),
  turnNumber: z.number().int().positive(),
  question: z.string().min(1),
  answer: z.string().min(1),
  difficulty: z.number().min(1).max(5),
});

export type InterviewTurn = z.infer<typeof interviewTurnSchema>;