import type { Board, Cell, Tetrimino } from "../../../shared/types/TetriLogic";

export function validatePlacement(board: Board, tetrimino: Tetrimino, anchor: Cell): boolean {
  for (const offset of tetrimino.shape) {
    const x = anchor.x + offset.x;
    const y = anchor.y + offset.y;

    if (x < 0 || y < 0 || x >= board.size.cols || y >= board.size.rows) {
      return false;
    }

    const target = board.cells[y][x];

    if (target.blocked) {
      return false;
    }

    if (target.tetriminoType !== null) {
      return false;
    }
  }

  return true;
}
