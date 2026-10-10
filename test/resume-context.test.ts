import { describe, expect, it } from "vitest";
import { createInitialVoiceTurn } from "../src/lib/voice/protocol";
import {
  createInterviewResumeContext,
  parseInterviewResumeContext,
} from "../src/lib/interview/resume-context";

describe("resume-to-interview context", () => {
  const profile = {
    fullName: "Private Candidate Name",
    branch: "ECE" as const,
    cgpa: 9.1,
    skills: ["Embedded C", "IoT"],
    projects: [{
      name: "Smart Irrigation",
      techStack: ["C", "ESP32", "MQTT"],
      summary: "Built a sensor-based irrigation prototype and measured water usage.",
    }],
  };

  it("carries project context and selected role without copying identity or CGPA", () => {
    const context = createInterviewResumeContext(profile, "Embedded Systems Intern");
    expect(context.branch).toBe("ECE");
    expect(context.role).toBe("Embedded Systems Intern");
    expect(context.resumeProjects[0]?.name).toBe("Smart Irrigation");
    expect(context.resumeProjects[0]?.techStack).toContain("ESP32");
    expect(JSON.stringify(context)).not.toContain("Private Candidate Name");
    expect(JSON.stringify(context)).not.toContain("9.1");
    expect(JSON.stringify(context)).not.toContain("Embedded C");
  });

  it("falls back to a clear role when the role input is blank", () => {
    expect(createInterviewResumeContext(profile, "   ").role).toBe("Technical Intern");
  });

  it("parses a valid tab-scoped context", () => {
    const context = createInterviewResumeContext(profile, "Embedded Systems Intern");
    expect(parseInterviewResumeContext(JSON.stringify(context))).toEqual(context);
  });

  it("uses the transferred project to ground the first adaptive interview question", async () => {
    const context = createInterviewResumeContext(profile, "Embedded Systems Intern");
    const state = await createInitialVoiceTurn({
      interviewId: "00000000-0000-7000-8000-000000000001",
      branch: context.branch,
      role: context.role,
      difficultyScore: 3,
      resumeProjects: context.resumeProjects,
      consentAccepted: true,
    }, { collegeId: null, consentAcceptedAtMs: 1_800_000_000_000 });

    expect(state.branch).toBe("ECE");
    expect(state.role).toBe("Embedded Systems Intern");
    expect(state.nextQuestion).toContain("Smart Irrigation");
    expect(state.nextQuestion).toContain("ESP32");
  });

  it("rejects malformed JSON, invalid branch codes and oversized project payloads", () => {
    expect(parseInterviewResumeContext("{bad")).toBeNull();
    expect(parseInterviewResumeContext(JSON.stringify({
      branch: "MADE_UP",
      role: "Intern",
      resumeProjects: [],
    }))).toBeNull();
    expect(parseInterviewResumeContext(JSON.stringify({
      branch: "ECE",
      role: "Intern",
      resumeProjects: Array.from({ length: 16 }, (_, index) => ({
        name: `Project ${index}`,
        techStack: [],
        summary: "A project",
      })),
    }))).toBeNull();
  });
});
