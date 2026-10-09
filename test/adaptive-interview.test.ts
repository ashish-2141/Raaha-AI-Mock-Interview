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
    answerHistory: [],
    lastQuestionAtMs: Date.now() - 5000,
    lastResponseDurationMs: 0,
    scoreBreakdown: { evidence: 0, reasoning: 0, specificity: 0, clarity: 0, total: 0 },
    antiCheatFlags: [],
    reviewRequired: false,
    evaluationHistory: [],
    qualityScore: 0,
    followUp: false,
    nextQuestion: "",
  };
}

describe("adaptive interview engine", () => {
  it("starts from a resume project", async () => {
    const result = await advanceInterview(base("", [], []));
    expect(result.nextQuestion).toContain("Hostel Booking API");
    expect(result.questionHistory).toContain(result.nextQuestion);
  });

  it("asks a deeper follow-up after a vague answer", async () => {
    const previous = "Explain caching.";
    const result = await advanceInterview(base("I used Redis.", [previous], ["caching"], 3));
    expect(result.followUp).toBe(true);
    expect(result.nextQuestion.toLowerCase()).toContain("go deeper");
    expect(result.answerHistory).toContain("I used Redis.");
  });

  it("raises difficulty after a strong answer", async () => {
    const previous = "Explain REST.";
    const result = await advanceInterview(base(
      "First I implemented REST endpoints with validation, then measured response latency because the trade-off was write cost versus read performance. For example, I tested the integration and verified the result before release.",
      [previous],
      ["backend"],
      3,
    ));
    expect(result.qualityScore).toBeGreaterThan(3);
    expect(result.difficultyScore).toBeGreaterThan(3);
    expect(result.followUp).toBe(false);
    expect(result.scoreBreakdown.total).toBeGreaterThan(0);
  });

  it("flags duplicate answers from server-held answer history", async () => {
    const duplicate = "First I would validate the request, then test the API because errors should be caught before release.";
    const input = base(duplicate, ["Explain REST."], ["backend"]);
    input.answerHistory = [duplicate];
    const result = await advanceInterview(input);
    expect(result.antiCheatFlags).toContain("duplicate-answer");
    expect(result.reviewRequired).toBe(true);
  });
});
