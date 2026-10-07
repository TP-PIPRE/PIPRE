import { create } from "zustand";
import { getAuthState } from "./authStore";

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
  startGame: (game: GameId) => void;
  resetGame: () => void;
  registerMove: () => void;
  requestHint: () => void;
  completeGame: (result: GameResult) => void;
  syncTelemetry: (attempt: AttemptMetrics) => Promise<void>;
  stopGame: () => void;
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

  startGame: (game) => {
    stopTimer();
    set({
      game,
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

  resetGame: () => {
    const { status } = get();
    if (status !== 'PLAYING') return;
    stopTimer();
    set((state) => ({
      reinicios: state.reinicios + 1,
      movimientos: 0,
      tiempoResolucion: 0,
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
      const { token } = getAuthState();
      const res = await fetch("/api/v1/telemetry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(attempt),
      });
      if (!res.ok) {
        throw new Error(`Telemetry HTTP ${res.status}`);
      }
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
    void get().syncTelemetry(attempt);
  },
}));
