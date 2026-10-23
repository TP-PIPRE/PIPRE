import type { Piece } from "../../../shared/types/TetriLogic";
import { TETRIMINO_COLORS, TETRIMINO_DND_TYPE } from "../../../shared/constants/tetrimino";

export interface PieceTrayProps {
  pieces: Piece[];
  selectedPieceId?: string | null;
  onSelectPiece?: (pieceId: string) => void;
}

export const PieceTray: React.FC<PieceTrayProps> = ({ pieces, selectedPieceId, onSelectPiece }) => {
  return (
    <div className="lab-tray" aria-label="Piezas disponibles">
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
          <button type="button"
            key={piece.id}
            aria-label={`Seleccionar pieza ${piece.type}`}
            aria-pressed={selectedPieceId === piece.id}
            onClick={() => onSelectPiece?.(piece.id)}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(
                TETRIMINO_DND_TYPE,
                JSON.stringify({ pieceId: piece.id }),
              );
              e.dataTransfer.effectAllowed = "move";
            }}
            className="lab-piece cursor-grab active:cursor-grabbing"
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
            <span>Pieza {piece.type}</span>
          </button>
        );
      })}
    </div>
  );
};
