import { describe, it, expect } from "vitest";
import type { RankingDTO } from "../../src/infrastructure/api/models/apiModels";

// Replicate the mapFromDto logic from RankingPage to test it in isolation
function mapFromDto(data: RankingDTO[]): any[] {
  const MOCK_RANKING_SEED: { id: string; name: string; group: string; xp: number }[] = [
    { id: "student-2", name: "Ana Sofía Lopez", group: "Robótica A", xp: 12500 },
    { id: "student-3", name: "Carlos Ruiz", group: "Mecatrónica B", xp: 11800 },
    { id: "student-4", name: "Elena García", group: "Robótica A", xp: 11250 },
  ];

  return data.map((dto) => {
    const seed = MOCK_RANKING_SEED.find((s) => s.id === dto.idStudent);
    return {
      position: dto.position,
      studentId: dto.idStudent,
      studentName: seed?.name ?? `Estudiante ${dto.idStudent}`,
      totalScore: dto.totalPoints,
      challengesCompleted: 0,
      lastUpdated: new Date().toISOString(),
      group: seed?.group,
    };
  });
}

function getLocalResults(courseId?: string): any[] {
  try {
    const stored = localStorage.getItem("pipre_results");
    if (!stored) return [];
    const results: any[] = JSON.parse(stored);
    const filtered = courseId ? results.filter((r) => r.courseId === courseId) : results;
    if (filtered.length === 0) return [];

    const map = new Map<string, { totalScore: number; challenges: Set<string>; lastUpdated: string }>();
    for (const r of filtered) {
      const existing = map.get(r.studentId);
      if (existing) {
        existing.totalScore = Math.max(existing.totalScore, r.score);
        existing.challenges.add(r.challengeId);
        if (r.completedAt > existing.lastUpdated) existing.lastUpdated = r.completedAt;
      } else {
        map.set(r.studentId, {
          totalScore: r.score,
          challenges: new Set([r.challengeId]),
          lastUpdated: r.completedAt,
        });
      }
    }
    return Array.from(map.entries())
      .map(([studentId, data]) => ({
        position: 0,
        studentId,
        studentName: `Estudiante ${studentId}`,
        totalScore: data.totalScore,
        challengesCompleted: data.challenges.size,
        lastUpdated: data.lastUpdated,
      }))
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((entry, i) => ({ ...entry, position: i + 1 }));
  } catch {
    return [];
  }
}

describe("RankingPage helpers", () => {
  describe("mapFromDto()", () => {
    it("mapea RankingDTO a RankingEntry con nombre conocido", () => {
      const dto: RankingDTO[] = [
        { idStudent: "student-2", totalPoints: 12500, position: 1 },
      ];
      const result = mapFromDto(dto);
      expect(result[0].studentName).toBe("Ana Sofía Lopez");
      expect(result[0].position).toBe(1);
      expect(result[0].totalScore).toBe(12500);
      expect(result[0].group).toBe("Robótica A");
    });

    it("usa nombre genérico para estudiantes desconocidos", () => {
      const dto: RankingDTO[] = [
        { idStudent: "unknown-1", totalPoints: 5000, position: 10 },
      ];
      const result = mapFromDto(dto);
      expect(result[0].studentName).toBe("Estudiante unknown-1");
    });

    it("mapea múltiples estudiantes", () => {
      const dto: RankingDTO[] = [
        { idStudent: "student-2", totalPoints: 12500, position: 1 },
        { idStudent: "student-3", totalPoints: 11800, position: 2 },
        { idStudent: "student-4", totalPoints: 11250, position: 3 },
      ];
      const result = mapFromDto(dto);
      expect(result).toHaveLength(3);
    });
  });

  describe("getLocalResults()", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it("retorna array vacío si no hay datos", () => {
      expect(getLocalResults()).toEqual([]);
    });

    it("retorna resultados ordenados por score descendente", () => {
      localStorage.setItem("pipre_results", JSON.stringify([
        { studentId: "stu1", challengeId: "ch1", score: 50, courseId: "C1", completedAt: "2025-01-01T00:00:00Z" },
        { studentId: "stu2", challengeId: "ch1", score: 100, courseId: "C1", completedAt: "2025-01-01T00:00:00Z" },
      ]));

      const results = getLocalResults();
      expect(results).toHaveLength(2);
      expect(results[0].studentId).toBe("stu2");
      expect(results[0].position).toBe(1);
      expect(results[1].studentId).toBe("stu1");
      expect(results[1].position).toBe(2);
    });

    it("filtra por courseId si se proporciona", () => {
      localStorage.setItem("pipre_results", JSON.stringify([
        { studentId: "stu1", challengeId: "ch1", score: 50, courseId: "C1", completedAt: "2025-01-01T00:00:00Z" },
        { studentId: "stu2", challengeId: "ch2", score: 75, courseId: "C2", completedAt: "2025-01-01T00:00:00Z" },
      ]));

      const results = getLocalResults("C1");
      expect(results).toHaveLength(1);
      expect(results[0].studentId).toBe("stu1");
    });

    it("conserva el mayor score por estudiante", () => {
      localStorage.setItem("pipre_results", JSON.stringify([
        { studentId: "stu1", challengeId: "ch1", score: 50, courseId: "C1", completedAt: "2025-01-01T00:00:00Z" },
        { studentId: "stu1", challengeId: "ch2", score: 75, courseId: "C1", completedAt: "2025-01-02T00:00:00Z" },
      ]));

      const results = getLocalResults("C1");
      expect(results).toHaveLength(1);
      expect(results[0].totalScore).toBe(75);
      expect(results[0].challengesCompleted).toBe(2);
    });
  });
});
