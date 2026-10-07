import type { Board as BoardState, Cell, Piece, TetriminoType } from "../../../shared/types/TetriLogic";
import { BsLockFill } from "react-icons/bs";
import { TETRIMINO_COLORS, TETRIMINO_DND_TYPE } from "../../../shared/constants/tetrimino";

export interface BoardProps {
  board: BoardState;
  pieces: Piece[];
  onPieceDrop: (pieceId: string, cell: Cell) => void;
  onRotatePiece: (pieceId: string) => void;
}

interface CellOccupancy {
  type: TetriminoType;
  pieceId: string;
}

export const Board: React.FC<BoardProps> = ({
  board,
  pieces,
  onPieceDrop,
  onRotatePiece,
}) => {
  const occupancy = new Map<string, CellOccupancy>();

  for (const piece of pieces) {
    for (const offset of piece.shape) {
      occupancy.set(
        `${piece.position.x + offset.x},${piece.position.y + offset.y}`,
        { type: piece.type, pieceId: piece.id },
      );
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, cell: Cell) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData(TETRIMINO_DND_TYPE);
    if (!raw) return;
    try {
      const { pieceId } = JSON.parse(raw) as { pieceId: string };
      if (pieceId) onPieceDrop(pieceId, cell);
    } catch {
      /* ignore malformed payload */
    }
  };

  return (
    <div
      className="grid gap-1 p-1 rounded-xl bg-surface border border-border shadow-lg"
      style={{
        gridTemplateRows: `repeat(${board.size.rows}, 1fr)`,
        gridTemplateColumns: `repeat(${board.size.cols}, 1fr)`,
        aspectRatio: `${board.size.cols} / ${board.size.rows}`,
      }}>
      {board.cells.flatMap((row) =>
        row.map((cell) => {
          const key = `${cell.position.x},${cell.position.y}`;
          const placed = occupancy.get(key);

          if (cell.blocked) {
            return (
              <div
                key={key}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, cell.position)}
                className="flex items-center justify-center rounded-sm bg-gray-500/80"
                title={`Bloqueada (${cell.position.x}, ${cell.position.y})`}>
                <BsLockFill className="text-sm text-gray-200" />
              </div>
            );
          }

          if (placed) {
            return (
              <div
                key={key}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(
                    TETRIMINO_DND_TYPE,
                    JSON.stringify({ pieceId: placed.pieceId }),
                  );
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, cell.position)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onRotatePiece(placed.pieceId);
                }}
                className={`${TETRIMINO_COLORS[placed.type]} rounded-sm shadow-inner cursor-grab active:cursor-grabbing`}
                title={`${placed.type} - click derecho para rotar`}
              />
            );
          }

          return (
            <div
              key={key}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, cell.position)}
              className="rounded-sm bg-surface-brighter border border-border"
              title={`(${cell.position.x}, ${cell.position.y})`}
            />
          );
        }),
      )}
    </div>
  );
};
