import type { Piece } from "../../../shared/types/TetriLogic";
import { TETRIMINO_COLORS } from "../../../shared/constants/tetrimino";

/** A shape, rather than its technical name, identifies a piece visually. */
export function PiecePreview({ piece, cellSize = 12, cellGap = 2 }: {
  piece: Pick<Piece, "shape" | "type">;
  cellSize?: number;
  cellGap?: number;
}) {
  const minX = Math.min(...piece.shape.map(c => c.x));
  const minY = Math.min(...piece.shape.map(c => c.y));
  const cols = Math.max(...piece.shape.map(c => c.x)) - minX + 1;
  const rows = Math.max(...piece.shape.map(c => c.y)) - minY + 1;
  return <span className="tetri-piece-preview" data-piece-type={piece.type} aria-hidden="true"><span className="tetri-mini-grid" style={{
    gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
    gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
    gap: cellGap,
  }}>
    {Array.from({ length: rows * cols }, (_, i) => <span key={i} data-piece-x={minX + i % cols} data-piece-y={minY + Math.floor(i / cols)} className={piece.shape.some(c =>
      c.x === minX + i % cols && c.y === minY + Math.floor(i / cols)) ? TETRIMINO_COLORS[piece.type] : undefined} />)}
  </span></span>;
}
