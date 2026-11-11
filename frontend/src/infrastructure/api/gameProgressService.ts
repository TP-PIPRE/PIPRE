import axiosInstance from "./axiosInstance";
import type { DailySetDTO, DailyChallengeDTO, GameAction, GameHintRequest, GameHintResponse, GameProgressDTO, GameSessionContext, GameSessionDTO, GameVictoryDTO, ProgressiveHint, ProgressiveHintProgress, ProgressiveHintRequest } from "./models/gameProgressModels";

export const gameProgressService = {
  active: async (context:GameSessionContext):Promise<GameSessionDTO|null> => {
    const response=await axiosInstance.get<GameSessionDTO>("game-sessions/active",{params:context});
    return response.status===204?null:response.data;
  },
  start: async (context: GameSessionContext, clientSessionId: string): Promise<GameSessionDTO> =>
    (await axiosInstance.post<GameSessionDTO>("game-sessions", { ...context, clientSessionId })).data,
  action: async (sessionId: string, action: GameAction & { sequence: number }): Promise<GameSessionDTO> =>
    (await axiosInstance.post<GameSessionDTO>(`game-sessions/${encodeURIComponent(sessionId)}/actions`, action)).data,
  hint: async (sessionId: string, request: GameHintRequest): Promise<GameHintResponse> =>
    (await axiosInstance.post<GameHintResponse>(`game-sessions/${encodeURIComponent(sessionId)}/hints`, request, { timeout: 1500 })).data,
  progressiveHintProgress: async (sessionId: string, signal: AbortSignal): Promise<ProgressiveHintProgress> =>
    (await axiosInstance.get<ProgressiveHintProgress>(`game-sessions/${encodeURIComponent(sessionId)}/progressive-hints`, { signal, timeout: 5000 })).data,
  progressiveHint: async (sessionId: string, request: ProgressiveHintRequest, signal: AbortSignal): Promise<ProgressiveHint> =>
    (await axiosInstance.post<ProgressiveHint>(`game-sessions/${encodeURIComponent(sessionId)}/progressive-hints`, request, { signal, timeout: 30_000 })).data,
  complete: async (sessionId: string): Promise<GameVictoryDTO> =>
    (await axiosInstance.post<GameVictoryDTO>(`game-sessions/${encodeURIComponent(sessionId)}/complete`)).data,
  dailySet: async (studentId: string, signal?: AbortSignal): Promise<DailySetDTO> =>
    (await axiosInstance.get<DailySetDTO>("daily-challenges/today/set", { params: { studentId }, signal })).data,
  daily: async (studentId: string, signal?: AbortSignal): Promise<DailyChallengeDTO> =>
    (await axiosInstance.get<DailyChallengeDTO>("daily-challenges/today", { params: { studentId }, signal })).data,
  progress: async (studentId: string): Promise<GameProgressDTO> =>
    (await axiosInstance.get<GameProgressDTO>(`profile/${encodeURIComponent(studentId)}/game-progress`)).data,
};
