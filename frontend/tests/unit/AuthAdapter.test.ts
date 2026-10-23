import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthAdapter } from "../../src/infrastructure/adapters/http/AuthAdapter";
import axiosInstance from "../../src/infrastructure/api/axiosInstance";
vi.mock("../../src/infrastructure/api/axiosInstance", () => ({ default: { post: vi.fn() } }));
const post = vi.mocked(axiosInstance.post);
const response = (role: string, email = "ana@test.local") => ({ data: { message: "Sesión iniciada", user: { idUser: "u-1", email, firstName: "Ana", lastName: "Prueba", role } } });
beforeEach(() => { vi.clearAllMocks(); });
describe("AuthAdapter HTTP contract", () => {
  it("uses the teacher role returned by the server even when the email has no role hint", async () => {
    post.mockResolvedValueOnce(response("docente"));
    const result = await new AuthAdapter().login("ana@test.local", "123");
    expect(result.user).toEqual({ id: "u-1", email: "ana@test.local", name: "Ana", role: "docente" });
    expect(result).not.toHaveProperty("token");
    expect(post).toHaveBeenCalledWith("auth/login", { email: "ana@test.local", password: "123" });
  });
  it("never elevates a student based on their email", async () => {
    post.mockResolvedValueOnce(response("student", "admin.docente@test.local"));
    expect((await new AuthAdapter().login("admin.docente@test.local", "123")).user.role).toBe("student");
  });
  it("rejects a missing or unsupported role instead of guessing", async () => {
    post.mockResolvedValueOnce(response("unknown"));
    await expect(new AuthAdapter().login("admin@test.local", "123")).rejects.toThrow("incompleta");
  });
  it("registers with the public student contract and then logs in using the returned user", async () => {
    post.mockResolvedValueOnce({ data: "u-1" }).mockResolvedValueOnce(response("student"));
    const user = await new AuthAdapter().register("Ana", "Prueba", "ana@test.local", "123", 15, "5to");
    expect(post).toHaveBeenNthCalledWith(1, "users", { firstName: "Ana", lastName: "Prueba", email: "ana@test.local", passwordHash: "123", age: 15, grade: "5to", roleIdList: [] });
    expect(user.id).toBe("u-1");
  });
  it("sends logout to the server that owns the HttpOnly cookie", async () => {
    post.mockResolvedValueOnce({ data: { message: "Sesión cerrada" } });
    await new AuthAdapter().logout();
    expect(post).toHaveBeenCalledWith("auth/logout");
  });
  it("preserves validation details from the backend", async () => {
    post.mockRejectedValueOnce({ response: { data: { errors: { age: "La edad no puede ser menor a 0" } } } });
    await expect(new AuthAdapter().register("Ana", "Prueba", "a@t.local", "123", -1, "5to")).rejects.toThrow("La edad no puede ser menor a 0");
  });
});
