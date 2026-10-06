import { z } from "zod";

export const InterviewProjectSchema = z.object({
  name: z.string().min(1).max(200),
  techStack: z.array(z.string().min(1).max(80)).max(30),
  summary: z.string().min(1).max(1000),
});

export const InterviewInputSchema = z.object({
  interviewId: z.uuid(),
  turnNumber: z.number().int().min(0).max(100),
  branch: z.string().min(1).max(80),
  role: z.string().min(1).max(120),
  difficultyScore: z.number().int().min(1).max(5),
  questionHistory: z.array(z.string().min(1)).max(100),
  evaluatedConcepts: z.array(z.string().min(1)).max(100),
  resumeProjects: z.array(InterviewProjectSchema).max(15),
  lastAnswer: z.string().max(5000).default(""),
});

export type InterviewInput = z.infer<typeof InterviewInputSchema>;