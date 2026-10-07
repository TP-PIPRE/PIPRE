import type { TetriminoType } from "../types/TetriLogic";

export const TETRIMINO_COLORS: Record<TetriminoType, string> = {
  O: "bg-yellow-400",
  I: "bg-cyan-400",
  T: "bg-purple-400",
  S: "bg-green-400",
  Z: "bg-red-400",
  L: "bg-orange-400",
  J: "bg-blue-400",
};

export const TETRIMINO_DND_TYPE = "application/x-tetrimino";
