export function createInterviewSession({ studentId, role }) {
  if (!studentId || !role) throw new Error("studentId and role are required");
  return { studentId, role, status: "active", turnCount: 0 };
}