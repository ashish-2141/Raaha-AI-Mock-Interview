import { describe, expect, it } from "vitest";
import { advanceInterview } from "../src/lib/interview/graph";
import { selectNextQuestion } from "../src/lib/interview/questions";

function base(lastAnswer: string, history: string[] = [], concepts: string[] = [], difficultyScore = 3) {
  return {
    interviewId: "00000000-0000-7000-8000-000000000001",
    collegeId: null,
    consentAcceptedAtMs: null,
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
    answerHistory: [] as string[],
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
  it.each([
    { branch: "CSE", role: "Technical Intern", expected: "versioned rest api" },
    { branch: "IT", role: "Technical Intern", expected: "versioned rest api" },
    { branch: "ECE", role: "Technical Intern", expected: "microcontroller" },
    { branch: "EEE", role: "Electrical Engineer", expected: "power quality" },
    { branch: "MECH", role: "Mechanical Engineer", expected: "manufacturing defect" },
    { branch: "CIVIL", role: "Civil Engineer", expected: "structural design" },
    { branch: "AI_ML", role: "Machine Learning Intern", expected: "machine-learning model" },
    { branch: "DATA_SCIENCE", role: "Data Analyst", expected: "dataset" },
    { branch: "CYBERSECURITY", role: "Security Analyst", expected: "threat-model" },
    { branch: "CHEMICAL", role: "Technical Intern", expected: "process-yield" },
    { branch: "METALLURGY", role: "Technical Intern", expected: "process-yield" },
    { branch: "MINING", role: "Technical Intern", expected: "process-yield" },
    { branch: "BIOTECH", role: "Technical Intern", expected: "process-yield" },
    { branch: "OTHER", role: "Mining Engineer", expected: "process-yield" },
  ])("selects a domain-specific question for $branch / $role", ({ branch, role, expected }) => {
    const question = selectNextQuestion({
      branch,
      role,
      difficulty: 3,
      questionHistory: [],
      evaluatedConcepts: [],
      resumeProjects: [],
      followUp: false,
    });
    expect(question.toLowerCase()).toContain(expected);
  });

  it("avoids repeating a question from the selected domain bank", () => {
    const first = "How would you evaluate a machine-learning model beyond accuracy, and detect data leakage?";
    const next = selectNextQuestion({
      branch: "AI_ML",
      role: "Machine Learning Intern",
      difficulty: 3,
      questionHistory: [first],
      evaluatedConcepts: [],
      resumeProjects: [],
      followUp: false,
    });
    expect(next).not.toBe(first);
  });

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
