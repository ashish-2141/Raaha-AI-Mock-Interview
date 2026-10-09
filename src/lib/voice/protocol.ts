import { advanceInterview } from "../interview/graph";
import type { VoiceStartInput } from "./types";

type VoiceSessionMetadata = {
  collegeId: string | null;
  consentAcceptedAtMs: number | null;
};

type VoiceSessionSeed = Pick<VoiceStartInput, "interviewId" | "branch" | "role" | "difficultyScore" | "resumeProjects">;

export function buildInitialVoiceState(
  input: VoiceSessionSeed,
  metadata: VoiceSessionMetadata = { collegeId: null, consentAcceptedAtMs: null },
) {
  return {
    interviewId: input.interviewId,
    collegeId: metadata.collegeId,
    consentAcceptedAtMs: metadata.consentAcceptedAtMs,
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

export async function createInitialVoiceTurn(
  input: VoiceStartInput,
  metadata: VoiceSessionMetadata,
) {
  return advanceInterview(buildInitialVoiceState(input, metadata));
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
