import type { Piece } from "../../../shared/types/TetriLogic";
import { TETRIMINO_COLORS, TETRIMINO_DND_TYPE } from "../../../shared/constants/tetrimino";

export interface PieceTrayProps {
  pieces: Piece[];
}

export const PieceTray: React.FC<PieceTrayProps> = ({ pieces }) => {
  return (
    <div className="flex flex-wrap gap-3 rounded-xl bg-surface border border-border shadow-lg p-3">
      {pieces.map((piece) => {
        const xs = piece.shape.map((c) => c.x);
        const ys = piece.shape.map((c) => c.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const cols = Math.max(...xs) - minX + 1;
        const rows = Math.max(...ys) - minY + 1;
        const isFilled = (x: number, y: number) =>
          piece.shape.some((c) => c.x === x && c.y === y);

        return (
          <div
            key={piece.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(
                TETRIMINO_DND_TYPE,
                JSON.stringify({ pieceId: piece.id }),
              );
              e.dataTransfer.effectAllowed = "move";
            }}
            className="cursor-grab active:cursor-grabbing rounded-lg bg-surface-brighter border border-border p-2 hover:border-primary transition-colors"
            title={`${piece.type} - arrastra al tablero`}>
            <div
              className="grid gap-0.5"
              style={{
                gridTemplateColumns: `repeat(${cols}, 12px)`,
                gridTemplateRows: `repeat(${rows}, 12px)`,
              }}>
              {Array.from({ length: rows }, (_, ry) =>
                Array.from({ length: cols }, (_, rx) => {
                  const filled = isFilled(minX + rx, minY + ry);
                  return (
                    <div
                      key={`${rx}-${ry}`}
                      className={
                        filled
                          ? `${TETRIMINO_COLORS[piece.type]} rounded-[2px]`
                          : "bg-transparent"
                      }
                    />
                  );
                }),
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
