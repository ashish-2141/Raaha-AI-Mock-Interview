import { StateGraph, StateSchema, START, END } from "@langchain/langgraph";
import { z } from "zod";
import { fairEvaluateAnswer } from "./fair-scoring";
import { isPreviouslyAskedQuestion, requestAiInterviewQuestion } from "./ai-question";
import { buildQuestionHistory, selectNextQuestion } from "./questions";

const ScoreBreakdownSchema = z.object({
  evidence: z.number().min(0).max(5),
  reasoning: z.number().min(0).max(5),
  specificity: z.number().min(0).max(5),
  clarity: z.number().min(0).max(5),
  total: z.number().min(0).max(100),
});

const EvaluationRecordSchema = z.object({
  concept: z.string(),
  qualityScore: z.number().int().min(0).max(5),
  scoreBreakdown: ScoreBreakdownSchema,
  antiCheatFlags: z.array(z.string()),
  reviewRequired: z.boolean(),
  responseDurationMs: z.number().int().min(0),
  evaluatedAtMs: z.number().int().min(0),
});

export const InterviewState = new StateSchema({
  interviewId: z.uuid(),
  collegeId: z.string().nullable(),
  consentAcceptedAtMs: z.number().int().min(0).nullable(),
  turnNumber: z.number().int().min(0),
  branch: z.string(),
  role: z.string(),
  difficultyScore: z.number().int().min(1).max(5),
  questionHistory: z.array(z.string()),
  evaluatedConcepts: z.array(z.string()),
  resumeProjects: z.array(z.object({
    name: z.string(),
    techStack: z.array(z.string()),
    summary: z.string(),
  })),
  lastAnswer: z.string(),
  answerHistory: z.array(z.string()),
  lastQuestionAtMs: z.number().int().min(0),
  lastResponseDurationMs: z.number().int().min(0),
  scoreBreakdown: ScoreBreakdownSchema,
  antiCheatFlags: z.array(z.string()),
  reviewRequired: z.boolean(),
  evaluationHistory: z.array(EvaluationRecordSchema),
  qualityScore: z.number().int().min(0).max(5),
  followUp: z.boolean(),
  nextQuestion: z.string(),
});

const evaluateNode = (state: typeof InterviewState.State) => {
  const answer = state.lastAnswer.trim();
  if (!answer) {
    return {
      qualityScore: 0,
      followUp: false,
      scoreBreakdown: { evidence: 0, reasoning: 0, specificity: 0, clarity: 0, total: 0 },
      antiCheatFlags: [],
      reviewRequired: false,
      lastResponseDurationMs: 0,
    };
  }

  const now = Date.now();
  const responseDurationMs = state.lastQuestionAtMs > 0
    ? Math.max(0, now - state.lastQuestionAtMs)
    : 0;
  const evaluation = fairEvaluateAnswer({
    answer,
    previousAnswers: state.answerHistory,
    responseDurationMs: responseDurationMs > 0 ? responseDurationMs : undefined,
    difficulty: state.difficultyScore,
  });
  const nextDifficulty =
    evaluation.qualityScore >= 4
      ? Math.min(5, state.difficultyScore + 1)
      : evaluation.qualityScore <= 2
        ? Math.max(1, state.difficultyScore - 1)
        : state.difficultyScore;

  return {
    qualityScore: evaluation.qualityScore,
    followUp: evaluation.needsFollowUp,
    evaluatedConcepts: [...state.evaluatedConcepts, evaluation.concept],
    difficultyScore: nextDifficulty,
    answerHistory: [...state.answerHistory, answer].slice(-100),
    scoreBreakdown: evaluation.scoreBreakdown,
    antiCheatFlags: evaluation.antiCheat.flags,
    reviewRequired: evaluation.antiCheat.reviewRequired,
    lastResponseDurationMs: responseDurationMs,
    evaluationHistory: [...state.evaluationHistory, {
      concept: evaluation.concept,
      qualityScore: evaluation.qualityScore,
      scoreBreakdown: evaluation.scoreBreakdown,
      antiCheatFlags: evaluation.antiCheat.flags,
      reviewRequired: evaluation.antiCheat.reviewRequired,
      responseDurationMs,
      evaluatedAtMs: now,
    }].slice(-100),
  };
};

const questionNode = async (state: typeof InterviewState.State) => {
  const deterministicQuestion = !state.lastAnswer.trim() && state.turnNumber === 0
    ? buildQuestionHistory(state.resumeProjects, state.role, state.branch)[0]
    : selectNextQuestion({
      branch: state.branch,
      role: state.role,
      difficulty: state.difficultyScore,
      questionHistory: state.questionHistory,
      evaluatedConcepts: state.evaluatedConcepts,
      resumeProjects: state.resumeProjects,
      followUp: state.followUp,
    });

  const aiQuestion = await requestAiInterviewQuestion(state);
  const nextQuestion =
    aiQuestion && !isPreviouslyAskedQuestion(aiQuestion, state.questionHistory)
      ? aiQuestion
      : deterministicQuestion;

  return {
    nextQuestion,
    questionHistory: [...state.questionHistory, nextQuestion].slice(-100),
    turnNumber: state.turnNumber + (state.lastAnswer.trim() ? 1 : 0),
    lastQuestionAtMs: Date.now(),
  };
};

export const interviewGraph = new StateGraph(InterviewState)
  .addNode("evaluate", evaluateNode)
  .addNode("question", questionNode)
  .addEdge(START, "evaluate")
  .addEdge("evaluate", "question")
  .addEdge("question", END)
  .compile();

export async function advanceInterview(input: typeof InterviewState.State) {
  return interviewGraph.invoke(input);
}
