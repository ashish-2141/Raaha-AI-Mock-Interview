import type { ResumeProfile } from "@/lib/resume/schema";

export const RESUME_INTERVIEW_CONTEXT_KEY = "raaha.interview.resumeContext";
export type InterviewProject = { name: string; techStack: string[]; summary: string };
export type InterviewResumeContext = {
  branch: ResumeProfile["branch"];
  role: string;
  resumeProjects: InterviewProject[];
};

const BRANCH_CODES = new Set<ResumeProfile["branch"]>([
  "CSE", "IT", "ECE", "EEE", "MECH", "CIVIL", "AI_ML", "DATA_SCIENCE", "CYBERSECURITY", "OTHER",
]);

/**
 * Reduce a parsed resume to the minimum context needed to personalise interview
 * questions. Candidate name, CGPA, and the broader skills list are not copied
 * into browser storage or the interview-start payload.
 */
export function createInterviewResumeContext(
  profile: Pick<ResumeProfile, "branch" | "projects">,
  role: string,
): InterviewResumeContext {
  return {
    branch: profile.branch,
    role: role.trim().slice(0, 120) || "Technical Intern",
    resumeProjects: profile.projects.slice(0, 15).map((project) => ({
      name: project.name,
      techStack: project.techStack.slice(0, 30),
      summary: project.summary,
    })),
  };
}

export function parseInterviewResumeContext(raw: string | null): InterviewResumeContext | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const candidate = value as Record<string, unknown>;
    if (typeof candidate.branch !== "string" || !BRANCH_CODES.has(candidate.branch as ResumeProfile["branch"])) return null;
    if (typeof candidate.role !== "string" || candidate.role.length > 120) return null;
    if (!Array.isArray(candidate.resumeProjects) || candidate.resumeProjects.length > 15) return null;

    const resumeProjects: InterviewProject[] = [];
    for (const project of candidate.resumeProjects) {
      if (!project || typeof project !== "object" || Array.isArray(project)) return null;
      const item = project as Record<string, unknown>;
      if (typeof item.name !== "string" || !item.name.trim() || item.name.length > 200) return null;
      if (typeof item.summary !== "string" || !item.summary.trim() || item.summary.length > 1000) return null;
      if (!Array.isArray(item.techStack) || item.techStack.length > 30
        || !item.techStack.every((skill) => typeof skill === "string" && skill.length > 0 && skill.length <= 80)) return null;
      resumeProjects.push({ name: item.name, summary: item.summary, techStack: item.techStack });
    }

    return { branch: candidate.branch as ResumeProfile["branch"], role: candidate.role, resumeProjects };
  } catch {
    return null;
  }
}
