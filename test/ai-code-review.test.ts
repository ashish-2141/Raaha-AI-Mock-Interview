import { describe, expect, it } from "vitest";
import { AiCodeReviewSchema, buildAiCodeReviewInput, generateAiCodeReview } from "../src/lib/coding/review";

describe("optional AI code review", () => {
  it("sends only the public challenge, submitted source and aggregate case count", () => {
    const parsed = JSON.parse(buildAiCodeReviewInput({
      challengeTitle: "Two Sum",
      challengePrompt: "Return the two input indices.",
      source: "export function twoSum() { return [0, 1]; }",
      passedCases: 3,
      totalCases: 5,
      fallbackReview: "The solution does not pass every hidden case.",
    })) as Record<string, unknown>;

    expect(parsed.challengeTitle).toBe("Two Sum");
    expect(parsed.publicChallengePrompt).toBe("Return the two input indices.");
    expect(parsed.submittedSource).toContain("twoSum");
    expect(parsed.hiddenTestSummary).toEqual({ passedCases: 3, totalCases: 5 });
    expect(parsed).not.toHaveProperty("hiddenCases");
    expect(parsed).not.toHaveProperty("fallbackReview");
  });

  it("requires user consent and the operator flag before a model call", async () => {
    const previousEnabled = process.env.RAAHA_AI_CODE_REVIEW_ENABLED;
    const previousKey = process.env.OPENAI_API_KEY;
    process.env.RAAHA_AI_CODE_REVIEW_ENABLED = "true";
    process.env.OPENAI_API_KEY = "unused-test-key";
    try {
      await expect(generateAiCodeReview({
        challengeTitle: "Two Sum",
        challengePrompt: "Find indices.",
        source: "export function twoSum() { return [0, 1]; }",
        passedCases: 5,
        totalCases: 5,
        fallbackReview: "Fallback review",
      }, false)).resolves.toBe("Fallback review");
    } finally {
      if (previousEnabled === undefined) delete process.env.RAAHA_AI_CODE_REVIEW_ENABLED;
      else process.env.RAAHA_AI_CODE_REVIEW_ENABLED = previousEnabled;
      if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = previousKey;
    }
  });

  it("validates concise complexity and code-review fields", () => {
    expect(AiCodeReviewSchema.safeParse({
      summary: "The solution scans the array once and uses a hash map.",
      timeComplexity: "O(n) expected",
      spaceComplexity: "O(n)",
      strengths: ["Linear expected time"],
      improvements: ["Add a comment explaining complement lookup."],
    }).success).toBe(true);

    expect(AiCodeReviewSchema.safeParse({
      summary: "ok",
      timeComplexity: "",
      spaceComplexity: "",
      strengths: [],
      improvements: [],
    }).success).toBe(false);
  });
});
