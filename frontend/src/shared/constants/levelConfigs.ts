import type { LevelConfig } from "../types/TetriLogic";
export { NEONFLOW_LEVELS } from "./neonFlowLevels";

export const TETRILOGIC_LEVELS: LevelConfig[] = [
  {
    level: 1,
    boardSize: { rows: 4, cols: 4 },
    blockedCells: [],
    constraints: [
      ...Array.from({ length: 4 }, (_, i) => ({ line: i, orientation: "row" as const, targetCount: 4 })),
      ...Array.from({ length: 4 }, (_, i) => ({ line: i, orientation: "column" as const, targetCount: 4 })),
    ],
  },
  {
    level: 2,
    boardSize: { rows: 4, cols: 4 },
    blockedCells: [
      { x: 0, y: 3 },
      { x: 1, y: 3 },
      { x: 2, y: 3 },
      { x: 3, y: 3 },
    ],
    constraints: [
      { line: 0, orientation: "row", targetCount: 4 },
      { line: 1, orientation: "row", targetCount: 4 },
      { line: 2, orientation: "row", targetCount: 4 },
    ],
  },
];
