import { beforeEach, describe, expect, it, vi } from "vitest";
import axiosInstance from "../../src/infrastructure/api/axiosInstance";
import { gameProgressService } from "../../src/infrastructure/api/gameProgressService";
vi.mock("../../src/infrastructure/api/axiosInstance", () => ({ default: { get: vi.fn().mockResolvedValue({ data: {} }), post: vi.fn().mockResolvedValue({ data: {} }) } }));
beforeEach(() => vi.clearAllMocks());
describe("Verified game API contract", () => {
  it("starts a session with contextual identity and an idempotency UUID", async () => {
    const context = { studentId: "student", game: "tetrilogic" as const, levelTemplate: "tetrilogic-v2-1", dailyChallengeId: "2026-11-02" };
    await gameProgressService.start(context, "uuid");
    expect(axiosInstance.post).toHaveBeenCalledWith("game-sessions", { ...context, clientSessionId: "uuid" });
  });
  it("sends sequential commands and confirms without client-provided score, time or success", async () => {
    await gameProgressService.action("session", { type: "PLACE", sequence: 1, pieceId: "o1", x: 0, y: 0, rotation: 0 });
    await gameProgressService.complete("session");
    expect(axiosInstance.post).toHaveBeenNthCalledWith(1, "game-sessions/session/actions", { type: "PLACE", sequence: 1, pieceId: "o1", x: 0, y: 0, rotation: 0 });
    expect(axiosInstance.post).toHaveBeenNthCalledWith(2, "game-sessions/session/complete");
  });
  it("asks the server for today's calendar assignment without sending a client date", async () => {
    await gameProgressService.daily("student");
    expect(axiosInstance.get).toHaveBeenCalledWith("daily-challenges/today", { params: { studentId: "student" }, signal: undefined });
  });
  it("passes cancellation when reading the persisted daily set",async()=>{
    const controller=new AbortController();await gameProgressService.dailySet("student",controller.signal);
    expect(axiosInstance.get).toHaveBeenCalledWith("daily-challenges/today/set",{params:{studentId:"student"},signal:controller.signal});
  });
  it("encodes identifiers when reading personal progress",async()=>{
    await gameProgressService.progress("student/other?role=admin");
    expect(axiosInstance.get).toHaveBeenCalledWith("profile/student%2Fother%3Frole%3Dadmin/game-progress");
  });
});
