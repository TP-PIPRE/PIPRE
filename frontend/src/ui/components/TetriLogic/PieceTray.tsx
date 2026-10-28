import type { Piece } from "../../../shared/types/TetriLogic";
import { TETRIMINO_COLORS, TETRIMINO_DND_TYPE } from "../../../shared/constants/tetrimino";
import { PiecePreview } from "./PiecePreview";

export interface PieceTrayProps {
  pieces: Piece[];
  selectedPieceId?: string | null;
  onSelectPiece?: (pieceId: string) => void;
  onRotatePiece?: (pieceId: string) => void;
  disabled?: boolean;
  pieceNumbers?: Record<string, number>;
  slots?: Piece[];
  pointerInteraction?: boolean;
  onPiecePointerDown?: (event: React.PointerEvent<HTMLButtonElement>, id: string) => void;
  onPieceActivate?: (event: React.MouseEvent<HTMLButtonElement>, id: string) => void;
}

export const PieceTray: React.FC<PieceTrayProps> = ({ pieces, selectedPieceId, onSelectPiece, onRotatePiece, disabled=false, pieceNumbers,slots,pointerInteraction=false,onPiecePointerDown,onPieceActivate }) => {
  return (
    <div className="lab-tray" aria-label="Piezas disponibles">
      {(slots??pieces).map((piece) => {
        const number = pieceNumbers?.[piece.id];
        if(slots && !pieces.some(p=>p.id===piece.id))return <span key={piece.id} className="lab-piece tetri-free-empty-slot" aria-hidden="true"><span className="tetri-piece-number">{number}</span><PiecePreview piece={piece}/></span>;
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
            aria-label={`Seleccionar pieza ${piece.type} (${piece.id})`}
            aria-description={number ? `Pieza ${number}` : undefined}
            aria-pressed={selectedPieceId === piece.id}
            onClick={e => onPieceActivate ? onPieceActivate(e,piece.id) : onSelectPiece?.(piece.id)}
            onPointerDown={e=>onPiecePointerDown?.(e,piece.id)}
            disabled={disabled}
            draggable={!disabled && !pointerInteraction}
            onContextMenu={e=>{if(onRotatePiece){e.preventDefault();if(!disabled)onRotatePiece(piece.id);}}}
            onKeyDown={e=>{if(e.key.toLowerCase()==="r" && onRotatePiece){e.preventDefault();e.stopPropagation();if(!disabled && !e.repeat)onRotatePiece(piece.id);}}}
            onDragStart={(e) => {
              if (disabled) return;
              e.dataTransfer.setData(
                TETRIMINO_DND_TYPE,
                JSON.stringify({ pieceId: piece.id }),
              );
              e.dataTransfer.effectAllowed = "move";
            }}
            className="lab-piece cursor-grab active:cursor-grabbing"
            title={number ? `Pieza ${number}: selecciona o arrastra` : `${piece.type} - arrastra al tablero`}>
            {number ? <><span className="tetri-piece-number" aria-hidden="true">{number}</span><PiecePreview piece={piece} /></> : <><div className="tetri-piece-preview"><div
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
            </div></div>
            <span className="tetri-piece-label">Pieza {piece.type} · {piece.id.slice(-1)}</span>
            </>}
          </button>
        );
      })}
    </div>
  );
};
