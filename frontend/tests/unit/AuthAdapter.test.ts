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
    it("envía firstName/lastName camelCase y devuelve el usuario autenticado", async () => {
      const UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

      vi.mocked(mockAxiosInstance.post)
        .mockResolvedValueOnce({ data: UUID })
        .mockResolvedValueOnce({
          data: {
            message: "Login exitoso",
            user: {
              idUser: UUID,
              email: "juan@test.com",
              firstName: "Juan",
              lastName: "Pérez",
              role: "student",
            },
          },
        });

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
          roleIdList: [],
        }),
      );

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
    it("usa el rol admin devuelto por el backend", async () => {
      const UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
      vi.mocked(mockAxiosInstance.post).mockResolvedValueOnce({
        data: {
          message: "Login exitoso",
          user: {
            idUser: UUID,
            email: "admin@test.com",
            firstName: "Admin",
            lastName: "PIPRE",
            role: "admin",
          },
        },
      });

      const result = await adapter.login("admin@test.com", "pass");
      expect(result.user.role).toBe("admin");
      expect(result.user.id).toBe(UUID);
    });

    it("asigna role docente por email si el backend no devuelve rol", async () => {
      vi.mocked(mockAxiosInstance.post).mockResolvedValueOnce({
        data: {
          message: "Login exitoso",
          user: {
            idUser: "teacher-1",
            email: "docente@test.com",
            firstName: "Docente",
            lastName: "PIPRE",
            role: "",
          },
        },
      });

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
