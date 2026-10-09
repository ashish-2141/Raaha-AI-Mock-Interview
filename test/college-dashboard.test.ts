import { describe, expect, it } from "vitest";
import { buildCollegeDashboardSummary, type DashboardSession } from "../src/lib/dashboard/aggregate";

function session(ownerId: string, concept = "databases", score = 2, branch = "CSE"): DashboardSession {
  return {
    ownerId,
    collegeId: "pilot-college",
    consentAcceptedAtMs: 1_800_000_000_000,
    branch,
    turnNumber: 2,
    evaluationHistory: [{
      concept,
      qualityScore: score,
      scoreBreakdown: { evidence: 2, reasoning: 2, specificity: 2, clarity: 2, total: 40 },
    }],
  };
}

describe("college dashboard aggregation", () => {
  it("suppresses the whole cohort below the privacy threshold", () => {
    const summary = buildCollegeDashboardSummary([
      session("student-1"),
      session("student-2"),
      session("student-3"),
      session("student-4"),
    ]);

    expect(summary.suppressed).toBe(true);
    expect(summary.participantCount).toBeNull();
    expect(summary.branches).toEqual([]);
    expect(summary.weakSkills).toEqual([]);
  });

  it("shows cohort-only branch and skill aggregates once five participants contribute", () => {
    const summary = buildCollegeDashboardSummary([
      session("student-1"),
      session("student-2"),
      session("student-3"),
      session("student-4"),
      session("student-5"),
    ]);

    expect(summary.suppressed).toBe(false);
    expect(summary.participantCount).toBe(5);
    expect(summary.branches).toHaveLength(1);
    expect(summary.branches[0]?.branch).toBe("CSE");
    expect(summary.weakSkills[0]?.skill).toBe("databases");
    expect(summary.weakSkills[0]?.weak).toBe(true);
    expect(JSON.stringify(summary)).not.toContain("student-1");
  });

  it("suppresses branch and skill groups with fewer than five distinct participants", () => {
    const summary = buildCollegeDashboardSummary([
      session("student-1", "databases", 2, "CSE"),
      session("student-2", "databases", 2, "CSE"),
      session("student-3", "databases", 2, "ECE"),
      session("student-4", "databases", 2, "ECE"),
      session("student-5", "databases", 2, "EEE"),
    ]);

    expect(summary.suppressed).toBe(false);
    expect(summary.branches).toEqual([]);
    expect(summary.weakSkills).toEqual([]);
    expect(summary.participantCount).toBeNull();
    expect(summary.sessionCount).toBeNull();
    expect(summary.completedSessions).toBeNull();
    expect(summary.submittedAnswers).toBeNull();
  });

  it("excludes sessions without consent or a college association", () => {
    const invalid = session("student-1");
    invalid.consentAcceptedAtMs = null;
    const unassigned = session("student-2");
    unassigned.collegeId = null;
    const summary = buildCollegeDashboardSummary([invalid, unassigned]);

    expect(summary.suppressed).toBe(true);
    expect(summary.participantCount).toBeNull();
  });
});
