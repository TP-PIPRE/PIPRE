import { create } from "zustand";
import { getAuthState } from "./authStore";
import axiosInstance from "../api/axiosInstance";

export type GameId = 'neonflow' | 'tetrilogic';

export type GameStatus = 'IDLE' | 'PLAYING' | 'SUCCESS' | 'FAILED';

export type GameResult = 'SUCCESS' | 'FAILED';

export interface AttemptMetrics {
  game: GameId;
  studentId: string;
  result: GameResult;
  tiempoResolucion: number;
  movimientos: number;
  reinicios: number;
  pistasIa: number;
  completedAt: string;
}

interface GameStoreState {
  game: GameId | null;
  status: GameStatus;
  movimientos: number;
  reinicios: number;
  pistasIa: number;
  tiempoResolucion: number;
  attempts: AttemptMetrics[];
  startGame: (game: GameId, options?: { telemetry?: boolean }) => void;
  resetGame: (options?: { preserveMetrics?: boolean }) => void;
  registerMove: () => void;
  requestHint: () => void;
  completeGame: (result: GameResult) => void;
  syncTelemetry: (attempt: AttemptMetrics) => Promise<void>;
  stopGame: () => void;
  legacyTelemetry: boolean;
}

let timerId: number | null = null;

const stopTimer = () => {
  if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }
};

const startTimer = (tick: () => void) => {
  stopTimer();
  timerId = window.setInterval(tick, 1000);
};

export const useGameStore = create<GameStoreState>()((set, get) => ({
  game: null,
  status: 'IDLE',
  movimientos: 0,
  reinicios: 0,
  pistasIa: 0,
  tiempoResolucion: 0,
  attempts: [],
  legacyTelemetry: true,

  startGame: (game, options) => {
    stopTimer();
    set({
      game,
      legacyTelemetry: options?.telemetry !== false,
      status: 'PLAYING',
      movimientos: 0,
      reinicios: 0,
      pistasIa: 0,
      tiempoResolucion: 0,
    });
    startTimer(() => {
      const { status } = get();
      if (status !== 'PLAYING') return;
      set((state) => ({ tiempoResolucion: state.tiempoResolucion + 1 }));
    });
  },

  resetGame: (options) => {
    const { status } = get();
    if (status !== 'PLAYING') return;
    stopTimer();
    set((state) => ({
      reinicios: state.reinicios + 1,
      movimientos: options?.preserveMetrics ? state.movimientos : 0,
      tiempoResolucion: options?.preserveMetrics ? state.tiempoResolucion : 0,
    }));
    startTimer(() => {
      const { status: current } = get();
      if (current !== 'PLAYING') return;
      set((state) => ({ tiempoResolucion: state.tiempoResolucion + 1 }));
    });
  },

  registerMove: () => {
    const { status } = get();
    if (status !== 'PLAYING') return;
    set((state) => ({ movimientos: state.movimientos + 1 }));
  },

  requestHint: () => {
    const { status } = get();
    if (status !== 'PLAYING') return;
    set((state) => ({ pistasIa: state.pistasIa + 1 }));
  },

  stopGame: () => {
    stopTimer();
    set({ status: 'IDLE', game: null });
  },

  syncTelemetry: async (attempt) => {
    try {
      await axiosInstance.post("telemetry", attempt, { skipAuthRedirect: true });
    } catch (err) {
      console.warn("Telemetry backend no disponible:", err);
    }
  },

  completeGame: (result) => {
    const { status, game, tiempoResolucion, movimientos, reinicios, pistasIa } = get();
    if (status !== 'PLAYING' || !game) return;

    const attempt: AttemptMetrics = {
      game,
      studentId: getAuthState().user?.id ?? "",
      result,
      tiempoResolucion,
      movimientos,
      reinicios,
      pistasIa,
      completedAt: new Date().toISOString(),
    };

    stopTimer();
    set((state) => ({
      status: result,
      attempts: [...state.attempts, attempt],
    }));
    if (get().legacyTelemetry) void get().syncTelemetry(attempt);
  },
}));
