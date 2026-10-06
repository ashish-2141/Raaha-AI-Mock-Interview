import type { InterviewInput } from "./types";

export function buildConversationContext(input: InterviewInput) {
  const recentTurns = input.questionHistory.slice(-3);
  const olderCount = Math.max(0, input.questionHistory.length - recentTurns.length);
  const projectContext = input.resumeProjects
    .slice(0, 5)
    .map((project) => `${project.name}: ${project.techStack.join(", ")} - ${project.summary}`)
    .join("\n");

  return [
    `Role: ${input.role}`,
    `Branch: ${input.branch}`,
    `Difficulty: ${input.difficultyScore}/5`,
    `Older turns summarized: ${olderCount}`,
    "Last 3 questions:",
    recentTurns.map((question, index) => `${index + 1}. ${question}`).join("\n") || "none",
    "Relevant resume projects:",
    projectContext || "none",
  ].join("\n");
}