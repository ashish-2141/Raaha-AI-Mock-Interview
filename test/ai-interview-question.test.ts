import { describe, expect, it } from "vitest";
import {
  AiInterviewQuestionSchema,
  buildInterviewQuestionInput,
  type AiQuestionContext,
} from "../src/lib/interview/ai-question";

const context: AiQuestionContext = {
  branch: "ECE",
  role: "Embedded/IoT Engineer",
  difficultyScore: 4,
  followUp: true,
  lastAnswer: "I used MQTT for the sensor gateway because it reduced message overhead.",
  questionHistory: ["Describe the sensor gateway.", "What is MQTT?"],
  evaluatedConcepts: ["backend", "messaging"],
  resumeProjects: [{
    name: "Sensor Gateway",
    techStack: ["C", "MQTT", "Linux"],
    summary: "A device gateway that forwards sensor readings over a weak network.",
  }],
};

describe("opt-in AI interview question context", () => {
  it("serializes only the context needed to produce an adaptive question", () => {
    const parsed = JSON.parse(buildInterviewQuestionInput(context)) as Record<string, unknown>;
    expect(parsed.branch).toBe("ECE");
    expect(parsed.targetRole).toBe("Embedded/IoT Engineer");
    expect(parsed.difficultyLevel).toBe(4);
    expect(parsed.shouldFollowUpOnLastAnswer).toBe(true);
    expect(parsed.previousQuestions).toEqual(context.questionHistory);
    expect(parsed.resumeProjects).toEqual(context.resumeProjects);
    expect(parsed).not.toHaveProperty("ownerId");
    expect(parsed).not.toHaveProperty("collegeId");
  });

  it("bounds the history and resume text sent to a provider", () => {
    const longContext: AiQuestionContext = {
      ...context,
      questionHistory: Array.from({ length: 12 }, (_, index) => "Question " + index),
      evaluatedConcepts: Array.from({ length: 12 }, (_, index) => "concept-" + index),
      resumeProjects: Array.from({ length: 12 }, (_, index) => ({
        name: "Project " + index,
        techStack: Array.from({ length: 20 }, (_, skill) => "skill-" + skill),
        summary: "s".repeat(1000),
      })),
    };
    const parsed = JSON.parse(buildInterviewQuestionInput(longContext)) as {
      previousQuestions: string[];
      evaluatedConcepts: string[];
      resumeProjects: Array<{ techStack: string[]; summary: string }>;
    };
    expect(parsed.previousQuestions).toHaveLength(6);
    expect(parsed.evaluatedConcepts).toHaveLength(6);
    expect(parsed.resumeProjects).toHaveLength(10);
    expect(parsed.resumeProjects[0]?.techStack).toHaveLength(15);
    expect(parsed.resumeProjects[0]?.summary.length).toBe(800);
  });

  it("validates a single concise question rather than accepting arbitrary provider output", () => {
    expect(AiInterviewQuestionSchema.safeParse({ question: "How would you test the gateway when MQTT messages arrive out of order?" }).success).toBe(true);
    expect(AiInterviewQuestionSchema.safeParse({ question: "ok" }).success).toBe(false);
    expect(AiInterviewQuestionSchema.safeParse({ question: "x".repeat(501) }).success).toBe(false);
  });
});
