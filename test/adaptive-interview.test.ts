import { describe, expect, it } from "vitest";
import { advanceInterview } from "../src/lib/interview/graph";

function base(lastAnswer: string, history: string[] = [], concepts: string[] = [], difficultyScore = 3) {
  return {
    interviewId: "00000000-0000-7000-8000-000000000001",
    turnNumber: history.length,
    branch: "CSE",
    role: "Junior Backend Developer",
    difficultyScore,
    questionHistory: history,
    evaluatedConcepts: concepts,
    resumeProjects: [
      { name: "Hostel Booking API", techStack: ["Java", "Spring Boot", "PostgreSQL"], summary: "REST API with authentication and booking transactions." },
    ],
    lastAnswer,
    qualityScore: 0,
    followUp: false,
    nextQuestion: "",
  };
}

describe("adaptive interview engine", () => {
  it("starts from a resume project", async () => {
    const result = await advanceInterview(base("", [], []));
    expect(result.nextQuestion).toContain("Hostel Booking API");
  });

  it("asks a deeper follow-up after a vague answer", async () => {
    const previous = "Explain caching.";
    const result = await advanceInterview(base("I used Redis.", [previous], ["caching"], 3));
    expect(result.followUp).toBe(true);
    expect(result.nextQuestion.toLowerCase()).toContain("go deeper");
  });

  it("raises difficulty after a strong answer", async () => {
    const previous = "Explain REST.";
    const result = await advanceInterview(base(
      "I implemented REST endpoints with validation, measured response latency, and added integration tests for error paths.",
      [previous],
      ["backend"],
      3,
    ));
    expect(result.difficultyScore).toBeGreaterThan(3);
    expect(result.followUp).toBe(false);
  });
});