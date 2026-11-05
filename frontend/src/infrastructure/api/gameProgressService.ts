import axiosInstance from "./axiosInstance";
import type { DailySetDTO, DailyChallengeDTO, GameAction, GameProgressDTO, GameSessionContext, GameSessionDTO, GameVictoryDTO } from "./models/gameProgressModels";

export const gameProgressService = {
  start: async (context: GameSessionContext, clientSessionId: string): Promise<GameSessionDTO> =>
    (await axiosInstance.post<GameSessionDTO>("game-sessions", { ...context, clientSessionId })).data,
  action: async (sessionId: string, action: GameAction & { sequence: number }): Promise<GameSessionDTO> =>
    (await axiosInstance.post<GameSessionDTO>(`game-sessions/${encodeURIComponent(sessionId)}/actions`, action)).data,
  complete: async (sessionId: string): Promise<GameVictoryDTO> =>
    (await axiosInstance.post<GameVictoryDTO>(`game-sessions/${encodeURIComponent(sessionId)}/complete`)).data,
  dailySet: async (studentId: string, signal?: AbortSignal): Promise<DailySetDTO> =>
    (await axiosInstance.get<DailySetDTO>("daily-challenges/today/set", { params: { studentId }, signal })).data,
  daily: async (studentId: string, signal?: AbortSignal): Promise<DailyChallengeDTO> =>
    (await axiosInstance.get<DailyChallengeDTO>("daily-challenges/today", { params: { studentId }, signal })).data,
  progress: async (studentId: string): Promise<GameProgressDTO> =>
    (await axiosInstance.get<GameProgressDTO>(`profile/${encodeURIComponent(studentId)}/game-progress`)).data,
};
