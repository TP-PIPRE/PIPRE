import { describe, it, expect, vi, beforeEach } from "vitest";
import { SimuladorUseCase } from "../../src/application/usecases/SimuladorUseCase";

vi.mock("../../src/infrastructure/api/apiService", () => ({
  apiService: {
    simulations: {
      getByUser: vi.fn(),
      postResult: vi.fn(),
    },
    results: {
      postResult: vi.fn(),
    },
  },
}));

vi.mock("../../src/infrastructure/store/authStore", () => ({
  getAuthState: vi.fn(),
}));

const { apiService } = await import("../../src/infrastructure/api/apiService");
const { getAuthState } = await import("../../src/infrastructure/store/authStore");

describe("SimuladorUseCase", () => {
  let useCase: SimuladorUseCase;

  beforeEach(() => {
    useCase = new SimuladorUseCase();
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("loadChallengesByCourse()", () => {
    it("usa userId desde getAuthState y deduplica por id_activity", async () => {
      vi.mocked(getAuthState).mockReturnValue({
        user: { id: "user-123", name: "Test", email: "test@test.com", role: "student" },
        token: "token",
      });

      vi.mocked(apiService.simulations.getByUser).mockResolvedValue([
        { id_simulation: "S1", result: JSON.stringify({ id_activity: "A1", title: "Reto 1", courseId: "C1", type: "challenge" }) },
        { id_simulation: "S2", result: JSON.stringify({ id_activity: "A1", title: "Reto 1 actualizado", courseId: "C1", type: "challenge" }) },
        { id_simulation: "S3", result: JSON.stringify({ id_activity: "A2", title: "Reto 2", courseId: "C1", type: "challenge" }) },
      ]);

      const challenges = await useCase.loadChallengesByCourse("C1");

      expect(apiService.simulations.getByUser).toHaveBeenCalledWith("user-123");
      // Should deduplicate by id_activity, keeping latest (S2 for A1)
      expect(challenges).toHaveLength(2);
      const a1Challenge = challenges.find((c) => c.id === "A1");
      expect(a1Challenge).toBeDefined();
      expect(a1Challenge?.id).toBe("A1");
    });

    it("retorna array vacío si no hay simulaciones", async () => {
      vi.mocked(getAuthState).mockReturnValue({
        user: { id: "user-123", name: "Test", email: "t@t.com", role: "student" },
        token: "t",
      });
      vi.mocked(apiService.simulations.getByUser).mockResolvedValue([]);

      const challenges = await useCase.loadChallengesByCourse("C1");
      expect(challenges).toEqual([]);
    });

    it("retorna array vacío si el usuario no tiene ID", async () => {
      vi.mocked(getAuthState).mockReturnValue({
        user: null,
        token: "",
      });

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
