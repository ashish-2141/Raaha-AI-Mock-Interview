import { describe, expect, it } from "vitest";
import { buildInitialVoiceState, buildLocalFallbackQuestion, buildLocalFallbackReply } from "../src/lib/voice/protocol";

const input = {
  interviewId: "00000000-0000-7000-8000-000000000001",
  branch: "EEE",
  role: "Electrical Engineer",
  difficultyScore: 3,
  resumeProjects: [],
};

describe("real-time voice interview protocol", () => {
  it("creates a serializable interview state for voice start", () => {
    const state = buildInitialVoiceState(input);
    expect(state.interviewId).toBe(input.interviewId);
    expect(state.lastAnswer).toBe("");
    expect(state.nextQuestion).toBe("");
  });

  it("provides a network-safe fallback question", () => {
    const question = buildLocalFallbackQuestion("Electrical Engineer", "EEE");
    expect(question).toContain("Network quality is limited");
    expect(question).toContain("EEE");
  });

  it("marks fallback mode without pretending adaptive scoring ran", () => {
    const reply = buildLocalFallbackReply("Electrical Engineer", "EEE");
    expect(reply.mode).toBe("fallback");
    expect(reply.qualityScore).toBe(0);
  });
});
