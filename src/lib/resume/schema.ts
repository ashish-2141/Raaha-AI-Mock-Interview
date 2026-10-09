import { z } from "zod";

export const BranchSchema = z.enum([
  "CSE",
  "IT",
  "ECE",
  "EEE",
  "MECH",
  "CIVIL",
  "AI_ML",
  "DATA_SCIENCE",
  "CYBERSECURITY",
  "CHEMICAL",
  "METALLURGY",
  "MINING",
  "BIOTECH",
  "OTHER",
]);

export const ResumeProjectSchema = z.object({
  name: z.string().min(1).max(200),
  techStack: z.array(z.string().min(1).max(80)).max(30),
  summary: z.string().min(1).max(1000),
});

export const ResumeProfileSchema = z.object({
  fullName: z.string().min(1).max(200),
  branch: BranchSchema,
  cgpa: z.number().min(0).max(10).nullable(),
  skills: z.array(z.string().min(1).max(80)).max(50),
  projects: z.array(ResumeProjectSchema).max(15),
});

export type ResumeProfile = z.infer<typeof ResumeProfileSchema>;
