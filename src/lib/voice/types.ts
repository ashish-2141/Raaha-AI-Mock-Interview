import { z } from "zod";
import { InterviewProjectSchema } from "@/lib/interview/types";

export const VoiceStartInputSchema = z.object({
  interviewId: z.uuid(),
  branch: z.string().min(1).max(80),
  role: z.string().min(1).max(120),
  difficultyScore: z.number().int().min(1).max(5).default(3),
  resumeProjects: z.array(InterviewProjectSchema).max(15).default([]),
  consentAccepted: z.literal(true),
  pilotCode: z.string().trim().min(1).max(128).optional(),
});

export const VoiceTurnInputSchema = z.object({
  interviewId: z.uuid(),
  transcript: z.string().trim().min(1).max(5000),
});

export type VoiceStartInput = z.infer<typeof VoiceStartInputSchema>;
export type VoiceTurnInput = z.infer<typeof VoiceTurnInputSchema>;

export const VoiceResponseSchema = z.object({
  interviewId: z.uuid(),
  turnNumber: z.number().int().min(0),
  nextQuestion: z.string().min(1),
  difficultyScore: z.number().int().min(1).max(5),
  followUp: z.boolean(),
  qualityScore: z.number().int().min(0).max(5),
  latencyMs: z.number().nonnegative(),
  mode: z.enum(["adaptive", "fallback"]),
});
