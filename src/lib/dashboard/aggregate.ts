export type ScoreBreakdown = {
  evidence: number;
  reasoning: number;
  specificity: number;
  clarity: number;
  total: number;
};

export type DashboardEvaluation = {
  concept: string;
  qualityScore: number;
  scoreBreakdown: ScoreBreakdown;
};

export type DashboardSession = {
  ownerId: string;
  collegeId: string | null;
  consentAcceptedAtMs: number | null;
  branch: string;
  turnNumber: number;
  evaluationHistory: DashboardEvaluation[];
};

export type SkillSummary = {
  branch: string;
  skill: string;
  participantCount: number;
  answers: number;
  averageQualityScore: number;
  weak: boolean;
};

export type BranchSummary = {
  branch: string;
  participantCount: number;
  sessionCount: number;
  answerCount: number;
  averageQualityScore: number;
  weakSkills: SkillSummary[];
};

export type CollegeDashboardSummary = {
  generatedAt: string;
  suppressed: boolean;
  minimumParticipants: number;
  participantCount: number | null;
  sessionCount: number | null;
  completedSessions: number | null;
  submittedAnswers: number | null;
  branches: BranchSummary[];
  weakSkills: SkillSummary[];
  note: string;
};

function rounded(value: number): number {
  return Math.round(value * 100) / 100;
}

function average(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function uniqueParticipants(sessions: DashboardSession[]): Set<string> {
  return new Set(sessions.map((session) => session.ownerId).filter(Boolean));
}

/**
 * Builds cohort-only data. Neither candidate IDs nor individual answers are returned.
 * Any branch or skill group smaller than the privacy threshold is suppressed.
 */
export function buildCollegeDashboardSummary(
  input: DashboardSession[],
  minimumParticipants = 5,
): CollegeDashboardSummary {
  const sessions = input.filter(
    (session) => session.collegeId !== null && session.consentAcceptedAtMs !== null && session.ownerId,
  );
  const participants = uniqueParticipants(sessions);
  const generatedAt = new Date().toISOString();

  if (participants.size < minimumParticipants) {
    return {
      generatedAt,
      suppressed: true,
      minimumParticipants,
      participantCount: null,
      sessionCount: null,
      completedSessions: null,
      submittedAnswers: null,
      branches: [],
      weakSkills: [],
      note: `Cohort details are hidden until at least ${minimumParticipants} consenting participants have contributed.`,
    };
  }

  const branchNames = [...new Set(sessions.map((session) => session.branch || "Unspecified"))].sort();
  const branches: BranchSummary[] = [];
  const allVisibleSkills: SkillSummary[] = [];

  for (const branch of branchNames) {
    const branchSessions = sessions.filter((session) => (session.branch || "Unspecified") === branch);
    const branchParticipants = uniqueParticipants(branchSessions);
    if (branchParticipants.size < minimumParticipants) continue;

    const evaluations = branchSessions.flatMap((session) => session.evaluationHistory);
    const skillNames = [...new Set(evaluations.map((evaluation) => evaluation.concept || "core-engineering"))].sort();
    const branchSkills: SkillSummary[] = [];

    for (const skill of skillNames) {
      const matching = branchSessions
        .filter((session) => session.evaluationHistory.some((evaluation) => (evaluation.concept || "core-engineering") === skill));
      const skillParticipants = uniqueParticipants(matching);
      if (skillParticipants.size < minimumParticipants) continue;

      const skillEvaluations = matching.flatMap((session) =>
        session.evaluationHistory.filter((evaluation) => (evaluation.concept || "core-engineering") === skill),
      );
      const averageQualityScore = rounded(average(skillEvaluations.map((evaluation) => evaluation.qualityScore)));
      const summary: SkillSummary = {
        branch,
        skill,
        participantCount: skillParticipants.size,
        answers: skillEvaluations.length,
        averageQualityScore,
        weak: averageQualityScore <= 3,
      };
      branchSkills.push(summary);
      allVisibleSkills.push(summary);
    }

    branches.push({
      branch,
      participantCount: branchParticipants.size,
      sessionCount: branchSessions.length,
      answerCount: evaluations.length,
      averageQualityScore: rounded(average(evaluations.map((evaluation) => evaluation.qualityScore))),
      weakSkills: branchSkills.filter((skill) => skill.weak).sort((a, b) => a.averageQualityScore - b.averageQualityScore),
    });
  }

  const visibleSessions = sessions.filter((session) => branches.some((branch) => branch.branch === (session.branch || "Unspecified")));
  const visibleEvaluations = visibleSessions.flatMap((session) => session.evaluationHistory);
  const hasSuppressedBranches = visibleSessions.length !== sessions.length;

  return {
    generatedAt,
    suppressed: false,
    minimumParticipants,
    participantCount: hasSuppressedBranches ? null : participants.size,
    sessionCount: hasSuppressedBranches ? null : visibleSessions.length,
    completedSessions: hasSuppressedBranches ? null : visibleSessions.filter((session) => session.turnNumber > 0).length,
    submittedAnswers: hasSuppressedBranches ? null : visibleEvaluations.length,
    branches,
    weakSkills: allVisibleSkills.filter((skill) => skill.weak).sort((a, b) => a.averageQualityScore - b.averageQualityScore),
    note: hasSuppressedBranches
      ? "Only aggregates from consenting participants are shown. Small branch groups are suppressed, so the full participant total is hidden. Individual answers and candidate identifiers are never returned."
      : branches.length === 0
        ? "The overall cohort reached the minimum, but no individual branch group has enough participants. Branch and skill breakdowns remain hidden."
        : "Only aggregates from consenting participants are shown. Individual answers and candidate identifiers are never returned.",
  };
}
