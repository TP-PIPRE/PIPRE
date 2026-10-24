import { describe, expect, it } from "vitest";
import { summarizeModule, type StudentMetrics } from "../../src/application/usecases/loadTeacherMetrics";

const student: StudentMetrics = {
  student: { idStudent: "s", studentName: "Estudiante", position: 1, totalPoints: 0, level: 1, xpTotal: 0, totalStars: 0, currentStreak: 0, maxStreak: 0 },
  risk: null, progress: [], results: [], errors: [],
};
const module = { idModule: "m", title: "Módulo", courseName: "Curso", activityIds: ["a"] };
describe("Academic metrics from saved records", () => {
  it("distinguishes absence of a record from a recorded zero", () => {
    expect(summarizeModule(module, [student]).averageProgress).toBeNull();
    expect(summarizeModule(module, [student]).averageScore).toBeNull();
    const recorded = { ...student, progress: [{ idProgress: "p", idStudent: "s", idModule: "m", status: "STARTED", percentage: 0, updatedAt: "2026-10-22T00:00:00" }] };
    expect(summarizeModule(module, [recorded]).averageProgress).toBe(0);
  });
  it("uses the latest progress per student and only results from the module", () => {
    const recorded = { ...student,
      progress: [
        { idProgress: "p-old", idStudent: "s", idModule: "m", status: "STARTED", percentage: 50, updatedAt: "2026-10-21T00:00:00" },
        { idProgress: "p-new", idStudent: "s", idModule: "m", status: "COMPLETED", percentage: 100, updatedAt: "2026-10-22T00:00:00" },
      ], results: [
        { idResult: "r1", idStudent: "s", idActivity: "a", score: 80, attempts: 1, date: "2026-10-22" },
        { idResult: "r2", idStudent: "s", idActivity: "a", score: 100, attempts: 2, date: "2026-10-22" },
        { idResult: "r3", idStudent: "s", idActivity: "other", score: 10, attempts: 1, date: "2026-10-22" },
      ],
    };
    const result = summarizeModule(module, [recorded, student]);
    expect(result.recordedStudents).toBe(1); expect(result.completedStudents).toBe(1);
    expect(result.averageProgress).toBe(100); expect(result.averageScore).toBe(90); expect(result.resultCount).toBe(2);
  });
});
