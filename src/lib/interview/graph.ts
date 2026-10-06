import { StateGraph, StateSchema, START, END } from "@langchain/langgraph";
import { z } from "zod";
import { evaluateAnswer } from "./evaluate";
import { buildQuestionHistory, selectNextQuestion } from "./questions";

export const InterviewState = new StateSchema({
  interviewId: z.uuid(),
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
  qualityScore: z.number().int().min(0).max(5),
  followUp: z.boolean(),
  nextQuestion: z.string(),
});

const evaluateNode = (state: typeof InterviewState.State) => {
  if (!state.lastAnswer.trim()) {
    return { qualityScore: 0, followUp: false };
  }
  const evaluation = evaluateAnswer(state.lastAnswer, state.difficultyScore);
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
  };
};

const questionNode = (state: typeof InterviewState.State) => ({
  nextQuestion: !state.lastAnswer.trim() && state.turnNumber === 0
    ? buildQuestionHistory(state.resumeProjects, state.role, state.branch)[0]
    : selectNextQuestion({
      branch: state.branch,
      role: state.role,
      difficulty: state.difficultyScore,
      questionHistory: state.questionHistory,
      evaluatedConcepts: state.evaluatedConcepts,
      resumeProjects: state.resumeProjects,
      followUp: state.followUp,
    }),
  turnNumber: state.turnNumber + (state.lastAnswer.trim() ? 1 : 0),
});

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
