type Project = { name: string; techStack: string[]; summary: string };

const QUESTION_BANK: Record<string, string[]> = {
  backend: [
    "Explain how you would design a versioned REST API for the role.",
    "How would you make a PostgreSQL-backed API safe under concurrent updates?",
    "Describe how you would test and monitor a production backend service.",
    "When would you use caching, and how would you handle cache invalidation?",
    "How would you debug a sudden increase in API p95 latency?",
    "Why are you interested in backend or software engineering work?",
    "Describe a software project where you personally owned a difficult part.",
    "Tell me about a technical disagreement and how you resolved it.",
    "Describe a time you had to fix a bug under a tight deadline.",
    "How would you explain a complex production issue to a non-technical teammate?",
  ],
  ece: [
    "Explain a system where a microcontroller reads a sensor and sends data to a backend.",
    "How would you debug an intermittent communication failure in an embedded device?",
    "Compare polling and interrupts for a sensor-driven embedded system.",
    "How would you design a simple IoT device for poor network conditions?",
    "What tests would you write for a sensor circuit before field deployment?",
    "Why do you want to work in electronics, embedded systems, or IoT?",
    "Describe a lab or project task where you diagnosed a hardware/software fault.",
    "Tell me about a team project and your individual contribution.",
    "How would you explain a difficult circuit or communication issue to a teammate?",
    "Describe how you respond when a hardware prototype fails near a deadline.",
  ],
  eee: [
    "How do you calculate voltage drop and power loss in a distribution feeder?",
    "Compare synchronous and induction motors and give a suitable application for each.",
    "How would you protect a motor circuit against overload and short circuit?",
    "Explain a practical method for improving power factor in an industrial load.",
    "How would you validate a solar inverter's performance under changing load?",
    "Why are you interested in electrical engineering, power, EVs, or renewables?",
    "Describe a practical measurement or lab exercise you completed and what it taught you.",
    "Tell me about working with a team on an electrical design or troubleshooting task.",
    "How would you communicate an electrical safety risk to a project manager?",
    "Describe how you would prioritise safety and deadlines during a site fault.",
  ],
  mechanical: [
    "How would you choose a material for a shaft under combined bending and torsion?",
    "Explain how you would estimate heat loss from a simple thermal system.",
    "When would you select CNC machining instead of additive manufacturing?",
    "How would you investigate vibration in a rotating machine?",
    "What checks would you include before releasing a CAD assembly for manufacturing?",
    "Why do you want a mechanical, manufacturing, automotive, or robotics internship?",
    "Describe a design or workshop task where you had to balance cost and strength.",
    "Tell me how you handled feedback on a drawing or prototype.",
    "How would you explain a manufacturing defect to a cross-functional team?",
    "Describe a time you had to re-plan a build or lab task after something failed.",
  ],
  civil: [
    "How would you estimate concrete quantity for a simple slab from its drawings?",
    "What site observations would make you suspect differential settlement?",
    "How do you decide which survey method fits a small construction site?",
    "What checks would you perform before a concrete pour?",
    "How would you plan traffic and drainage considerations for a small road project?",
    "Why are you interested in civil engineering, infrastructure, or construction?",
    "Describe a site visit or design exercise and the most important thing you learned.",
    "Tell me about coordinating a group assignment with multiple deliverables.",
    "How would you communicate a safety concern to a site supervisor?",
    "Describe how you would handle a design change close to a project deadline.",
  ],
  ai_ml: [
    "How would you split a dataset to avoid leakage when evaluating a classifier?",
    "Compare precision, recall and F1, and explain when you would prioritise each.",
    "How would you investigate a model whose training score is high but validation score is low?",
    "When is a simple baseline preferable to a deep-learning model?",
    "How would you monitor data drift after deploying a model?",
    "Why do you want to work in AI, machine learning or applied data products?",
    "Describe a model or experiment you built and the assumption you tested.",
    "Tell me about a time a result contradicted your initial hypothesis.",
    "How would you explain a model's limitations to a product stakeholder?",
    "Describe how you would work through an experiment that repeatedly fails.",
  ],
  data_science: [
    "How would you investigate missing values in a dataset before fitting a predictive model?",
    "Explain the difference between correlation and causation using a business example.",
    "How would you select a metric for an imbalanced classification problem?",
    "How would you design a SQL query to compare weekly retention cohorts?",
    "How would you communicate uncertainty in an analysis to decision-makers?",
    "Why are you interested in data analysis, analytics or data science?",
    "Describe an analysis where you changed your conclusion after checking the data.",
    "Tell me about a time you explained a chart or finding to a non-technical audience.",
    "How do you prioritise competing analysis requests from stakeholders?",
    "What would you do if a stakeholder asked you to prove a conclusion the data does not support?",
  ],
  cybersecurity: [
    "How would you triage a suspicious login alert before declaring an incident?",
    "Explain least privilege and how you would review excessive permissions.",
    "What is the difference between authentication and authorisation?",
    "How would you assess the risk of a newly disclosed dependency vulnerability?",
    "What evidence would you preserve when investigating a phishing report?",
    "Why do you want to work in cybersecurity or security operations?",
    "Describe a lab exercise where you identified and fixed a security weakness.",
    "How would you report a vulnerability responsibly to a development team?",
    "How do you stay systematic when several alerts arrive at once?",
    "What would you do if a senior teammate dismissed a credible security concern?",
  ],
  chemical: [
    "How would you estimate material and energy balances for a simple process unit?",
    "What operating variables would you monitor to keep a heat exchanger effective?",
    "How would you respond to an unexpected pressure increase in a process line?",
    "Explain how you would choose a separation method for a mixture.",
    "What process-safety checks belong in a basic hazard review?",
    "Why are you interested in chemical engineering or process operations?",
    "Describe a laboratory procedure where measurement accuracy mattered.",
    "Tell me about following a safety protocol when others were rushing.",
    "How would you explain a process deviation to a shift supervisor?",
    "How do you balance production targets with process safety?",
  ],
  metallurgy: [
    "How do carbon content and heat treatment affect steel hardness and toughness?",
    "How would you distinguish a fatigue failure from a brittle fracture?",
    "What tests would you choose to compare two candidate metal alloys?",
    "How does corrosion affect material selection for an industrial component?",
    "How would you investigate an unexpected defect in a cast component?",
    "Why are you interested in metallurgy, materials or steel production?",
    "Describe a materials lab experiment and the limitations of its result.",
    "Tell me about a team task that required careful handling of measurements.",
    "How would you present evidence that a material batch should be rejected?",
    "Describe how you would respond to a quality problem close to dispatch.",
  ],
  mining: [
    "What factors affect the choice between open-pit and underground mining?",
    "How would you identify and prioritise hazards before a field operation?",
    "What measurements are needed to estimate ore grade and recovery?",
    "How would you reduce dust exposure and environmental impact at a mine site?",
    "What would you inspect after an unexpected slope movement or ground change?",
    "Why are you interested in mining, mineral processing or mine operations?",
    "Describe a fieldwork or geology exercise and how you validated observations.",
    "How would you communicate a safety stop decision under production pressure?",
    "Tell me how you would coordinate with a team in difficult field conditions.",
    "How would you balance productivity, worker safety and environmental obligations?",
  ],
  biotech: [
    "How would you design controls for a basic laboratory experiment?",
    "Explain why contamination control matters in cell culture or microbiology.",
    "How would you assess whether a measured biological result is reproducible?",
    "What is the difference between sensitivity and specificity in a diagnostic assay?",
    "How would you record and investigate an unexpected batch result?",
    "Why are you interested in biotechnology, bioprocess or pharma work?",
    "Describe a practical lab task where careful documentation mattered.",
    "How would you respond if your experiment contradicted published expectations?",
    "How would you explain a laboratory limitation to a non-specialist teammate?",
    "Describe how you would handle a protocol deviation without hiding the error.",
  ],
  default: [
    "Walk me through a technical project you built and the hardest decision you made.",
    "How would you break a large technical problem into smaller testable parts?",
    "Tell me about a bug you would expect in this type of system and how you would isolate it.",
    "How do you decide whether a technical trade-off is worth the added complexity?",
    "What evidence would you collect before saying a system is ready for release?",
    "Why are you interested in this internship role and this technical domain?",
    "Describe a team project where you learned from a mistake.",
    "Tell me about a time you had to learn an unfamiliar tool quickly.",
    "How do you handle conflicting feedback from teammates?",
    "How would you explain a complex idea clearly to someone outside your field?",
  ],
};

const BRANCH_STARTERS: Record<string, string> = {
  backend: "Start with a recent software or backend project and explain one technical decision you made.",
  ece: "Start with a recent electronics, embedded, or IoT project and explain one technical decision you made.",
  eee: "Start with an electrical, power, EV, or renewable-energy project and explain one technical decision you made.",
  mechanical: "Start with a mechanical design, manufacturing, or robotics project and explain one technical decision you made.",
  civil: "Start with a civil, surveying, construction, or infrastructure project and explain one technical decision you made.",
  ai_ml: "Start with an AI/ML experiment and explain the hypothesis, evaluation method, and one limitation.",
  data_science: "Start with an analysis project and explain how you validated the data and the conclusion.",
  cybersecurity: "Start with a security lab or audit and explain how you verified the finding safely.",
  chemical: "Start with a process or chemical engineering lab and explain one safety or measurement decision.",
  metallurgy: "Start with a materials or metallurgy project and explain how you validated the material properties.",
  mining: "Start with a mining, geology, or mineral-processing task and explain one operational or safety decision.",
  biotech: "Start with a biotech or life-sciences lab project and explain the controls used to validate the result.",
};

function resolveQuestionBankKey(branch: string, role: string): string {
  const branchKey = branch.toLowerCase().replace(/[\s/-]+/g, "_");
  const roleKey = role.toLowerCase();
  if (branchKey.includes("ece") || branchKey.includes("electronics")) return "ece";
  if (branchKey.includes("eee") || branchKey.includes("electrical")) return "eee";
  if (branchKey.includes("mech") || branchKey.includes("mechanical")) return "mechanical";
  if (branchKey.includes("civil")) return "civil";
  if (branchKey.includes("cyber") || roleKey.includes("security")) return "cybersecurity";
  if (branchKey.includes("data_science") || roleKey.includes("data analyst") || roleKey.includes("analytics")) return "data_science";
  if (branchKey.includes("ai_ml") || branchKey.includes("machine learning") || roleKey.includes("machine learning") || roleKey.includes("ai engineer")) return "ai_ml";
  if (branchKey.includes("chemical")) return "chemical";
  if (branchKey.includes("metallurgy")) return "metallurgy";
  if (branchKey.includes("mining")) return "mining";
  if (branchKey.includes("biotech")) return "biotech";
  if (roleKey.includes("embedded") || roleKey.includes("iot") || roleKey.includes("telecom")) return "ece";
  if (roleKey.includes("electrical") || roleKey.includes("power systems")) return "eee";
  if (roleKey.includes("mechanical") || roleKey.includes("manufacturing") || roleKey.includes("automotive")) return "mechanical";
  if (roleKey.includes("civil") || roleKey.includes("construction")) return "civil";
  if (roleKey.includes("chemical") || roleKey.includes("process engineer")) return "chemical";
  if (roleKey.includes("metallurgy") || roleKey.includes("materials engineer")) return "metallurgy";
  if (roleKey.includes("mining")) return "mining";
  if (roleKey.includes("biotech") || roleKey.includes("bioprocess")) return "biotech";
  if (roleKey.includes("backend") || roleKey.includes("software") || roleKey.includes("java") || branchKey === "cse" || branchKey === "it") return "backend";
  return "default";
}

export function getQuestionBankForContext(branch: string, role: string): readonly string[] {
  return QUESTION_BANK[resolveQuestionBankKey(branch, role)] ?? QUESTION_BANK.default;
}

export function buildQuestionHistory(resumeProjects: Project[], role: string, branch: string) {
  const project = resumeProjects[0];
  const intro = project
    ? `Tell me about ${project.name}. What did you build, what was your contribution, and why did you choose ${project.techStack.slice(0, 3).join(", ")}?`
    : BRANCH_STARTERS[resolveQuestionBankKey(branch, role)] ??
      `Start with a recent project relevant to a ${role} role and explain your contribution.`;
  return [intro];
}

function estimateQuestionDifficulty(question: string): number {
  const normalized = question.toLowerCase();
  if (/\b(why are you interested|tell me about a time|team project|communicate|non-technical|stakeholder|feedback|individual contribution)\b/.test(normalized)) {
    return 2;
  }
  if (/\b(concurrent|monitor|investigate|debug|incident|out of order|failure|drift|uncertainty|trade-off|tradeoff|hazard|safety risk|unexpected|under changing)\b/.test(normalized)) {
    return 4;
  }
  return 3;
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
  if (args.followUp) {
    const lastConcept = args.evaluatedConcepts.at(-1) ?? "the previous topic";
    if (args.difficulty <= 2) {
      return `Build up from the basics of ${lastConcept}: explain the main idea in simple terms, give one example, and say how you would check it.`;
    }
    if (args.difficulty >= 4) {
      return `Go deeper on ${lastConcept}: compare two approaches, explain the trade-offs and failure cases, and describe how you would verify the result.`;
    }
    return `Go deeper on ${lastConcept}: give a concrete example, explain your trade-off, and tell me how you verified it worked.`;
  }

  const projectHints = args.resumeProjects
    .flatMap((project) => project.techStack)
    .map((skill) => skill.toLowerCase());

  const ranked = getQuestionBankForContext(args.branch, args.role)
    .filter((question) => !args.questionHistory.includes(question))
    .sort((a, b) => {
      const aHits = projectHints.filter((skill) => a.toLowerCase().includes(skill)).length;
      const bHits = projectHints.filter((skill) => b.toLowerCase().includes(skill)).length;
      const aDifficultyGap = Math.abs(estimateQuestionDifficulty(a) - args.difficulty);
      const bDifficultyGap = Math.abs(estimateQuestionDifficulty(b) - args.difficulty);
      return (bHits - aHits) || (aDifficultyGap - bDifficultyGap);
    });

  return ranked[0] ?? `Raise the difficulty: solve a realistic ${args.role} scenario and justify your design decisions step by step.`;
}
