import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthAdapter } from "../../src/infrastructure/adapters/http/AuthAdapter";

vi.mock("../../src/infrastructure/api/axiosInstance", () => ({
  default: {
    post: vi.fn(),
  },
}));

const mockAxiosInstance = (await import("../../src/infrastructure/api/axiosInstance")).default;

describe("AuthAdapter", () => {
  let adapter: AuthAdapter;

  beforeEach(() => {
    adapter = new AuthAdapter();
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("register()", () => {
    it("envía firstName/lastName camelCase y guarda UUID en localStorage", async () => {
      const UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
      const JWT = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic3R1ZGVudCJ9.abc";

      vi.mocked(mockAxiosInstance.post)
        .mockResolvedValueOnce({ data: UUID })
        .mockResolvedValueOnce({ data: JWT });

      const result = await adapter.register(
        "Juan", "Pérez", "juan@test.com", "pass123", 15, "9°",
      );

      expect(vi.mocked(mockAxiosInstance.post)).toHaveBeenNthCalledWith(
        1,
        "users",
        expect.objectContaining({
          firstName: "Juan",
          lastName: "Pérez",
          email: "juan@test.com",
          passwordHash: "pass123",
          role: "student",
        }),
      );

      const stored = JSON.parse(localStorage.getItem("pipre_registered_users") || "{}");
      expect(stored["juan@test.com"]).toBe(UUID);
      expect(result.id).toBe(UUID);
      expect(result.role).toBe("student");
    });

    it("lanza error si el POST falla", async () => {
      vi.mocked(mockAxiosInstance.post).mockRejectedValueOnce({
        response: { data: { message: "Email duplicado" } },
      });

      await expect(
        adapter.register("Juan", "Pérez", "dup@test.com", "pass", 15, "9°"),
      ).rejects.toThrow("Email duplicado");
    });
  });

  describe("login()", () => {
    it("decodifica JWT para asignar role admin", async () => {
      const UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
      const adminJWT = `header.${btoa(JSON.stringify({ role: "admin" }))}.sig`;
      localStorage.setItem("pipre_registered_users", JSON.stringify({ "admin@test.com": UUID }));

      vi.mocked(mockAxiosInstance.post).mockResolvedValueOnce({ data: adminJWT });

      const result = await adapter.login("admin@test.com", "pass");
      expect(result.user.role).toBe("admin");
      expect(result.user.id).toBe(UUID);
    });

    it("asigna role docente por email si no hay role en JWT", async () => {
      const jwtNoRole = `header.${btoa(JSON.stringify({}))}.sig`;
      vi.mocked(mockAxiosInstance.post).mockResolvedValueOnce({ data: jwtNoRole });

      const result = await adapter.login("docente@test.com", "pass");
      expect(result.user.role).toBe("docente");
    });

    it("lanza error con credenciales inválidas", async () => {
      vi.mocked(mockAxiosInstance.post).mockRejectedValueOnce({
        response: { data: { message: "Credenciales inválidas" } },
      });

      await expect(adapter.login("bad@test.com", "wrong")).rejects.toThrow("Credenciales inválidas");
    });
  });
});
