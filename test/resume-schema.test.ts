import { describe, expect, it } from "vitest";
import { ResumeProfileSchema } from "../src/lib/resume/schema";

const fixtures = [
  ["Asha", "CSE", 8.7],
  ["Bharat", "IT", 7.9],
  ["Chitra", "ECE", null],
  ["Dev", "EEE", 8.1],
  ["Esha", "MECH", 7.2],
  ["Farhan", "CIVIL", 8.3],
  ["Gauri", "AI_ML", 9.0],
  ["Hari", "DATA_SCIENCE", 8.5],
  ["Isha", "CYBERSECURITY", 7.8],
  ["Kiran", "CHEMICAL", 7.1],
  ["Lata", "METALLURGY", 8.0],
  ["Manav", "MINING", 7.5],
  ["Nisha", "BIOTECH", 8.2],
  ["Om", "OTHER", null],
] as const;

describe("ResumeProfileSchema", () => {
  it("validates synthetic schema fixtures for all supported B.Tech branches", () => {
    for (const [fullName, branch, cgpa] of fixtures) {
      const result = ResumeProfileSchema.safeParse({
        fullName,
        branch,
        cgpa,
        skills: ["JavaScript", "SQL"],
        projects: [{ name: "Project", techStack: ["TypeScript"], summary: "A synthetic fixture project." }],
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects an invalid CGPA", () => {
    const result = ResumeProfileSchema.safeParse({
      fullName: "Test",
      branch: "CSE",
      cgpa: 12,
      skills: [],
      projects: [],
    });
    expect(result.success).toBe(false);
  });
});
