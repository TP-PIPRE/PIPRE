import { describe, it, expect, vi, beforeEach } from "vitest";
import { SimuladorUseCase } from "../../src/application/usecases/SimuladorUseCase";

vi.mock("../../src/infrastructure/api/apiService", () => ({
  apiService: {
    modules: {
      getByCourse: vi.fn(),
    },
    lessons: {
      getByModule: vi.fn(),
    },
    activities: {
      getByLesson: vi.fn(),
    },
    results: {
      postResult: vi.fn(),
    },
  },
}));

const { apiService } = await import("../../src/infrastructure/api/apiService");

describe("SimuladorUseCase", () => {
  let useCase: SimuladorUseCase;

  beforeEach(() => {
    useCase = new SimuladorUseCase();
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("loadChallengesByCourse()", () => {
    it("carga módulos, lecciones y actividades de robótica del curso", async () => {
      vi.mocked(apiService.modules.getByCourse).mockResolvedValue([
        { idModule: "M1", name: "Módulo 1", idCourse: "C1" },
      ]);
      vi.mocked(apiService.lessons.getByModule).mockResolvedValue([
        { idLesson: "L1", name: "Lección 1", idModule: "M1" },
      ]);
      vi.mocked(apiService.activities.getByLesson).mockResolvedValue([
        { idActivity: "A1", name: "Reto 1", idLesson: "L1", type: "robotics", difficulty: "EASY", environment: "battle" },
        { idActivity: "A2", name: "Reto 2", idLesson: "L1", type: "robotics", difficulty: "MEDIUM", environment: "maze" },
        { idActivity: "A3", name: "Lectura", idLesson: "L1", type: "reading" },
      ]);

      const challenges = await useCase.loadChallengesByCourse("C1");

      expect(apiService.modules.getByCourse).toHaveBeenCalledWith("C1");
      expect(apiService.lessons.getByModule).toHaveBeenCalledWith("M1");
      expect(apiService.activities.getByLesson).toHaveBeenCalledWith("L1");
      expect(challenges).toHaveLength(2);
      const a1Challenge = challenges.find((c) => c.id === "A1");
      expect(a1Challenge).toBeDefined();
      expect(a1Challenge?.idCourse).toBe("C1");
    });

    it("retorna array vacío si no hay módulos", async () => {
      vi.mocked(apiService.modules.getByCourse).mockResolvedValue([]);

      const challenges = await useCase.loadChallengesByCourse("C1");
      expect(challenges).toEqual([]);
    });

    it("retorna array vacío si la API falla", async () => {
      vi.mocked(apiService.modules.getByCourse).mockRejectedValue(new Error("API caída"));

      const challenges = await useCase.loadChallengesByCourse("C1");
      expect(challenges).toEqual([]);
    });
  });

  describe("saveResult()", () => {
    it("guarda resultado en localStorage pipre_results", async () => {
      await useCase.saveResult({
        studentId: "stu1",
        challengeId: "ch1",
        score: 100,
        courseId: "C1",
        completedAt: "2025-01-01T00:00:00Z",
      });

      const stored = JSON.parse(localStorage.getItem("pipre_results") || "[]");
      expect(stored).toHaveLength(1);
      expect(stored[0].studentId).toBe("stu1");
      expect(stored[0].score).toBe(100);
    });
  });
});
