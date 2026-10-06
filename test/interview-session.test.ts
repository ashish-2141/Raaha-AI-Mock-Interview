import { describe, expect, it } from "vitest";
import { interviewTurnSchema } from "../src/lib/ai/types";

describe("interviewTurnSchema", () => {
  it("accepts a valid interview turn", () => {
    const result = interviewTurnSchema.safeParse({
      interviewId: "00000000-0000-7000-8000-000000000001",
      turnNumber: 1,
      question: "Explain how Redis caching works.",
      answer: "Redis keeps hot data in memory.",
      difficulty: 3,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an out-of-range difficulty", () => {
    const result = interviewTurnSchema.safeParse({
      interviewId: "00000000-0000-7000-8000-000000000001",
      turnNumber: 1,
      question: "Explain Redis.",
      answer: "It is an in-memory data store.",
      difficulty: 8,
    });
    expect(result.success).toBe(false);
  });
});