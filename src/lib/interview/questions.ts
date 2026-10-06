type Project = { name: string; techStack: string[]; summary: string };

const QUESTION_BANK: Record<string, string[]> = {
  backend: [
    "Explain how you would design a versioned REST API for the role.",
    "How would you make a PostgreSQL-backed API safe under concurrent updates?",
    "Describe how you would test and monitor a production backend service.",
    "When would you use caching, and how would you handle cache invalidation?",
    "How would you secure an API used by thousands of students?",
  ],
  ece: [
    "Explain a system where a microcontroller reads a sensor and sends data to a backend.",
    "How would you debug an intermittent communication failure in an embedded device?",
    "Compare polling and interrupts for a sensor-driven embedded system.",
    "How would you design a simple IoT device for poor network conditions?",
  ],
  default: [
    "Walk me through a technical project you built and the hardest decision you made.",
    "How would you break a large technical problem into smaller testable parts?",
    "Tell me about a bug you would expect in this type of system and how you would isolate it.",
    "How do you decide whether a technical trade-off is worth the added complexity?",
  ],
};

export function buildQuestionHistory(resumeProjects: Project[], role: string, branch: string) {
  const project = resumeProjects[0];
  const intro = project
    ? `Tell me about ${project.name}. What did you build, what was your contribution, and why did you choose ${project.techStack.slice(0, 3).join(", ")}?`
    : branch.toLowerCase().includes("ece")
      ? "Start with a recent ECE project and explain one technical decision you made."
      : `Start with a recent project relevant to a ${role} role and explain your contribution.`;
  return [intro];
}

export function selectNextQuestion(args: {
  branch: string;
  role: string;
  difficulty: number;
  questionHistory: string[];
  evaluatedConcepts: string[];
  resumeProjects: Project[];
  followUp: boolean;
}) {
  const branchKey = args.branch.toLowerCase();
  const roleKey = args.role.toLowerCase();
  const bank = branchKey.includes("ece") || branchKey.includes("electronics")
    ? QUESTION_BANK.ece
    : roleKey.includes("backend") || roleKey.includes("software") || roleKey.includes("java")
      ? QUESTION_BANK.backend
      : QUESTION_BANK.default;

  if (args.followUp) {
    const lastConcept = args.evaluatedConcepts.at(-1) ?? "the previous topic";
    return `Go deeper on ${lastConcept}: give a concrete example, explain your trade-off, and tell me how you verified it worked.`;
  }

  const projectHints = args.resumeProjects
    .flatMap((project) => project.techStack)
    .map((skill) => skill.toLowerCase());

  const ranked = bank
    .filter((question) => !args.questionHistory.includes(question))
    .sort((a, b) => {
      const aHits = projectHints.filter((skill) => a.toLowerCase().includes(skill)).length;
      const bHits = projectHints.filter((skill) => b.toLowerCase().includes(skill)).length;
      return bHits - aHits;
    });

  return ranked[0] ?? `Raise the difficulty: solve a realistic ${args.role} scenario and justify your design decisions step by step.`;
}