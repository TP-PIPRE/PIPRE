import { create } from "zustand";

export type GameId = 'neonflow' | 'tetrilogic';

export type GameStatus = 'IDLE' | 'PLAYING' | 'SUCCESS' | 'FAILED';

export type GameResult = 'SUCCESS' | 'FAILED';

export interface AttemptMetrics {
  game: GameId;
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

  completeGame: (result) => {
    const { status, game, tiempoResolucion, movimientos, reinicios, pistasIa } = get();
    if (status !== 'PLAYING' || !game) return;
    stopTimer();
    set((state) => ({
      status: result,
      attempts: [
        ...state.attempts,
        {
          game,
          result,
          tiempoResolucion,
          movimientos,
          reinicios,
          pistasIa,
          completedAt: new Date().toISOString(),
        },
      ],
    }));
  },
}));
