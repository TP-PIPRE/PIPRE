import type { LevelConfig, Piece } from "../../../shared/types/TetriLogic";
import { counts } from "./rules";
import { canPlaceFreely, isPlaced } from "./freePlay";

/** Active challenge: only published row/column targets and legal geometry count. */
export function lineGoalsMet(level: LevelConfig, pieces: Piece[]): boolean {
  const placed = pieces.filter(isPlaced);
  if (!level.constraints.length || placed.some(piece => !canPlaceFreely(level.boardSize, placed, piece))) return false;
  const totals = counts(level, placed);
  return level.constraints.every(goal => (goal.orientation === "row" ? totals.rows : totals.cols)[goal.line] === goal.targetCount);
}
