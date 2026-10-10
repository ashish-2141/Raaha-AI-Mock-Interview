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
    "How would you design an IoT device for poor network conditions?",
    "How would you test signal integrity and reliability in an embedded/VLSI design?",
  ],
  eee: [
    "How would you diagnose unstable power quality in an electrical distribution system?",
    "Compare induction and synchronous motors and explain how you would choose between them.",
    "How would you evaluate the efficiency and safety of an EV charging system?",
    "How would you compare a solar installation's expected generation with measured output?",
    "What protections would you add to a control system before commissioning it?",
  ],
  mechanical: [
    "How would you investigate a repeated manufacturing defect using process data?",
    "Explain the assumptions behind a thermodynamic cycle and how you would validate them.",
    "How would you choose a material and manufacturing process for a loaded component?",
    "What checks would you run before releasing a CAD assembly for production?",
    "How would you evaluate safety and reliability in an automated production line?",
  ],
  civil: [
    "How would you check a structural design against its loads and applicable constraints?",
    "How would you plan a site survey and validate the measurements before construction?",
    "How would you identify the critical path and control risk on an infrastructure project?",
    "What quality checks would you record before accepting a concrete pour?",
    "How would you assess transport, drainage, and soil constraints at a project site?",
  ],
  ai_ml: [
    "How would you evaluate a machine-learning model beyond accuracy, and detect data leakage?",
    "How would you choose a baseline before training a more complex model?",
    "How would you monitor model drift after deployment?",
    "How would you compare precision, recall and calibration for an imbalanced dataset?",
    "How would you make an ML experiment reproducible from its data and configuration?",
  ],
  data_science: [
    "How would you validate a dataset before drawing a business conclusion?",
    "Explain how you would investigate missing values and selection bias in a dataset.",
    "How would you design an experiment to determine whether a change improved a metric?",
    "How would you communicate uncertainty in a dashboard to a non-technical stakeholder?",
    "How would you detect an unexpected shift in a production metric?",
  ],
  cybersecurity: [
    "How would you threat-model a login API and prioritise its largest risks?",
    "How would you investigate a suspicious authentication pattern without exposing user data?",
    "How would you verify a vulnerability and demonstrate its impact safely?",
    "What controls would you add to reduce the impact of a compromised application secret?",
    "How would you design a patch and regression-test process for a critical vulnerability?",
  ],
  process: [
    "How would you investigate a process-yield drop using a mass balance and production records?",
    "How would you handle an ore or material sample whose measured composition differs from specification?",
    "What safety checks are required before changing a chemical or bioprocess operating parameter?",
    "How would you validate a quality-control method before using it to release a batch?",
    "How would you reduce waste in a process while preserving product quality and worker safety?",
  ],
  default: [
    "Walk me through a technical project you built and the hardest decision you made.",
    "How would you break a large technical problem into smaller testable parts?",
    "Tell me about a bug you would expect in this type of system and how you would isolate it.",
    "How do you decide whether a technical trade-off is worth the added complexity?",
  ],
};

function selectBank(branch: string, role: string): string[] {
  const branchKey = branch.toLowerCase().replace(/[_/]+/g, " ");
  const roleKey = role.toLowerCase().replace(/[_/]+/g, " ");
  const context = branchKey + " " + roleKey;

  // Branch-specific intent takes precedence over a generic target role so an
  // ECE student applying for a software internship can still discuss domain work.
  if (/\b(ece|electronics|embedded|vlsi|iot|telecom)\b/.test(context)) return QUESTION_BANK.ece!;
  if (/\b(eee|electrical|electric power|power systems|renewable energy|solar engineer|ev engineer)\b/.test(context)) return QUESTION_BANK.eee!;
  if (/\b(mech|mechanical|manufacturing|thermodynamics|automotive|robotics|cad engineer|production engineer)\b/.test(context)) return QUESTION_BANK.mechanical!;
  if (/\b(civil|structural|surveying|construction|infrastructure engineer)\b/.test(context)) return QUESTION_BANK.civil!;
  if (/\b(ai ml|machine learning|artificial intelligence|ml engineer|deep learning)\b/.test(context)) return QUESTION_BANK.ai_ml!;
  if (/\b(data science|data scientist|data analyst|analytics|business intelligence)\b/.test(context)) return QUESTION_BANK.data_science!;
  if (/\b(cybersecurity|cyber security|infosec|security analyst|penetration test)\b/.test(context)) return QUESTION_BANK.cybersecurity!;
  if (/\b(chemical|metallurgy|metallurgical|materials|mining|biotech|biotechnology|pharma process|process engineer|bioprocess)\b/.test(context)) return QUESTION_BANK.process!;
  if (/\b(backend|software|java|web developer|full stack|fullstack)\b/.test(context)) return QUESTION_BANK.backend!;
  return QUESTION_BANK.default!;
}

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
  const bank = selectBank(args.branch, args.role);

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
