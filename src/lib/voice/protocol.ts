import { advanceInterview } from "../interview/graph";
import type { VoiceStartInput } from "./types";

export function buildInitialVoiceState(input: VoiceStartInput) {
  return {
    interviewId: input.interviewId,
    turnNumber: 0,
    branch: input.branch,
    role: input.role,
    difficultyScore: input.difficultyScore,
    questionHistory: [],
    evaluatedConcepts: [],
    resumeProjects: input.resumeProjects,
    lastAnswer: "",
    answerHistory: [],
    lastQuestionAtMs: 0,
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

export async function createInitialVoiceTurn(input: VoiceStartInput) {
  return advanceInterview(buildInitialVoiceState(input));
}

export function buildLocalFallbackQuestion(role: string, branch: string) {
  const subject = branch.trim() || role.trim() || "your target role";
  return `Network quality is limited. Keep going with a text-safe question: what is one important technical decision you would make for a ${subject} interview, and how would you test it?`;
}

export function buildLocalFallbackReply(role: string, branch: string) {
  return {
    nextQuestion: buildLocalFallbackQuestion(role, branch),
    qualityScore: 0,
    followUp: false,
    difficultyScore: 3,
    mode: "fallback" as const,
  };
}
