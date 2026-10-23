import { afterEach, describe, expect, it } from "vitest";
import { getAuthState, setAuthState, clearAuthState } from "../../src/infrastructure/store/authStore";
import axiosInstance from "../../src/infrastructure/api/axiosInstance";
const student = { id: "u1", email: "a@test.local", name: "Ana", role: "student" };
afterEach(() => { clearAuthState(); });
describe("Session contract", () => {
  it("handles corrupt metadata without crashing route rendering", () => {
    document.cookie = "pipre_user=%broken; Path=/";
    expect(getAuthState()).toEqual({ user: null, isAuthenticated: false });
  });
  it("stores only user metadata", () => {
    setAuthState(student);
    expect(getAuthState()).toEqual({ user: student, isAuthenticated: true });
    expect(document.cookie).not.toContain("jwt=");
  });
  it("keeps the session after a 403 permission denial", async () => {
    setAuthState(student);
    await expect(axiosInstance.get("roles", { adapter: async () => { throw { response: { status: 403 } }; } })).rejects.toBeDefined();
    expect(getAuthState().isAuthenticated).toBe(true);
  });
  it("clears expired session metadata after a 401", async () => {
    window.history.replaceState({}, "", "/login");
    setAuthState(student);
    await expect(axiosInstance.get("users/u1", { adapter: async () => { throw { response: { status: 401 } }; } })).rejects.toBeDefined();
    expect(getAuthState().isAuthenticated).toBe(false);
  });
  it("does not interrupt the game when background telemetry loses its session", async () => {
    setAuthState(student);
    await expect(axiosInstance.post("telemetry", {}, { skipAuthRedirect: true, adapter: async config => { throw { config, response: { status: 401 } }; } })).rejects.toBeDefined();
    expect(getAuthState().isAuthenticated).toBe(true);
  });
});
