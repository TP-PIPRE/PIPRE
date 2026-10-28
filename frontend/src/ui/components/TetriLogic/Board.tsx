import type { Board as BoardState, Cell, Piece, TetriminoType, LevelConfig } from "../../../shared/types/TetriLogic";
import { LockKeyhole } from "lucide-react";
import { counts } from "../../../application/usecases/tetrilogic/rules";
import { TETRIMINO_COLORS, TETRIMINO_DND_TYPE } from "../../../shared/constants/tetrimino";
import { PieceSurface } from "./PieceSurface";

export interface BoardProps {
  board: BoardState;
  pieces: Piece[];
  onPieceDrop: (pieceId: string, cell: Cell) => void;
  onRotatePiece: (pieceId: string, cell?: Cell) => void;
  selectedPieceId?: string | null;
  onSelectPiece?: (pieceId: string) => void;
  level?: LevelConfig;
  lineGoals?: LevelConfig["constraints"];
  disabled?: boolean;
  pieceNumbers?: Record<string, number>;
  freePlay?: boolean;
  boardRef?: React.Ref<HTMLDivElement>;
  hiddenPieceId?: string;
  onPiecePointerDown?: (event: React.PointerEvent<HTMLButtonElement>, id: string, cell: Cell) => void;
  onCellActivate?: (event: React.MouseEvent<HTMLButtonElement>, cell: Cell, pieceId?: string) => void;
}

function LineIndicator({ current, target, orientation, line, compact = false }: {current:number;target?:number;orientation:"row"|"column";line:number;compact?:boolean}) {
  if (target === undefined) return <span className="tetri-count tetri-count-unset" aria-label={`${orientation === "row" ? "Fila" : "Columna"} ${line + 1}: sin objetivo`}>—</span>;
  const state=current===target ? "complete" : current>target ? "over" : "pending";
  return <span className={`tetri-count tetri-count-${orientation}`} data-state={state}
    aria-label={`${orientation==="row"?"Fila":"Columna"} ${line+1}: ${current} de ${target}`}>
    {!compact && <span className="tetri-count-bars" aria-hidden="true">{Array.from({length:Math.max(target,current)},(_,i)=><i key={i} data-filled={i<current} data-extra={i>=target}/>)}{!target && !current && <i className="tetri-zero"/>}</span>}
    <span className="tetri-count-number">{current}<span>/{target}</span></span>
  </span>;
}

export const Board = ({board,pieces,onPieceDrop,onRotatePiece,selectedPieceId,onSelectPiece,level,lineGoals,disabled=false,pieceNumbers,freePlay=false,boardRef,hiddenPieceId,onPiecePointerDown,onCellActivate}: BoardProps) => {
  const official=level?.version===2 && !freePlay;
  const showCounts = official || Boolean(lineGoals?.length);
  const totals=showCounts && counts({boardSize:board.size},pieces);
  const target=(orientation:"row"|"column",line:number)=>(lineGoals ?? level?.constraints)?.find(c=>c.orientation===orientation && c.line===line)?.targetCount;
  const occupancy=new Map<string,{type:TetriminoType;pieceId:string}>();
  for(const piece of pieces.filter(p=>p.id!==hiddenPieceId)) for(const offset of piece.shape) occupancy.set(`${piece.position.x+offset.x},${piece.position.y+offset.y}`,{type:piece.type,pieceId:piece.id});
  function drop(e:React.DragEvent,cell:Cell) {
    e.preventDefault();
    if(disabled)return;
    try {
      const raw=e.dataTransfer.getData(TETRIMINO_DND_TYPE);
      if(!raw)return;
      const {pieceId,offset}=JSON.parse(raw) as {pieceId:unknown;offset?:Cell};
      if(typeof pieceId!=="string")return;
      if(offset && (!Number.isInteger(offset.x) || !Number.isInteger(offset.y)))return;
      if(pieceId)onPieceDrop(pieceId,{x:cell.x-(offset?.x??0),y:cell.y-(offset?.y??0)});
    } catch { /* Discard malformed drag payloads. */ }
  }
  function dragOver(e:React.DragEvent) {e.preventDefault();e.dataTransfer.dropEffect="move";}
  return <div className={freePlay?`tetri-free-board-frame${showCounts ? " tetri-has-counts" : ""}`:official?"tetri-board-frame":"w-full max-w-[460px]"}>
    {showCounts && <div className="tetri-column-counts" style={{gridTemplateColumns:`repeat(${board.size.cols},minmax(0,1fr))`}}>
      {totals && totals.cols.map((v,i)=><LineIndicator key={i} current={v} target={target("column",i)} orientation="column" line={i} compact={freePlay}/>)}</div>}
    <div className={showCounts?"tetri-grid-with-counts":"flex w-full gap-1"}>
      {showCounts && <div className="tetri-row-counts" style={{gridTemplateRows:`repeat(${board.size.rows},1fr)`}}>
        {totals && totals.rows.map((v,i)=><LineIndicator key={i} current={v} target={target("row",i)} orientation="row" line={i} compact={freePlay}/>)}</div>}
      <div ref={boardRef} className="game-board grid gap-1 p-1 rounded-xl bg-surface border border-border shadow-lg"
        aria-label="Tablero TetriLogic" style={{gridTemplateRows:`repeat(${board.size.rows},1fr)`,gridTemplateColumns:`repeat(${board.size.cols},1fr)`,aspectRatio:`${board.size.cols}/${board.size.rows}`}}>
        {board.cells.flatMap(row=>row.map(cell=>{
          const key=`${cell.position.x},${cell.position.y}`;
          const placed=occupancy.get(key);
          const piece=placed && pieces.find(p=>p.id===placed.pieceId);
          const firstCell=piece?.shape.reduce((a,b)=>b.y<a.y || (b.y===a.y && b.x<a.x)?b:a);
          const showNumber=piece && firstCell && cell.position.x===piece.position.x+firstCell.x && cell.position.y===piece.position.y+firstCell.y;
          const required=level?.requiredCells?.some(c=>c.x===cell.position.x && c.y===cell.position.y);
          const label=cell.blocked?"Celda bloqueada":placed?`Pieza ${placed.type}`:"Celda vacía";
          return <button key={key} type="button" disabled={disabled} draggable={!freePlay && Boolean(placed)&&!disabled}
            data-cell-x={cell.position.x} data-cell-y={cell.position.y} data-piece-id={placed?.pieceId}
            aria-label={`${label}, fila ${cell.position.y+1}, columna ${cell.position.x+1}${required&&!placed&&!cell.blocked?", debe ocuparse":""}`}
            aria-pressed={placed?selectedPieceId===placed.pieceId:undefined}
            aria-description={placed && pieceNumbers ? `Pieza ${pieceNumbers[placed.pieceId]}` : undefined}
            className={cell.blocked?"tetri-cell-blocked flex items-center justify-center rounded-sm bg-gray-500/80":placed?`tetri-cell-filled ${freePlay ? "" : TETRIMINO_COLORS[placed.type]} rounded-sm cursor-grab`:"tetri-cell-empty rounded-sm bg-surface-brighter border border-border"}
            title={cell.blocked?"Celda bloqueada":placed?`${pieceNumbers?`Pieza ${pieceNumbers[placed.pieceId]}`:placed.pieceId.toUpperCase()} · clic derecho para rotar`:required?"Esta celda debe ocuparse":`Fila ${cell.position.y+1}, columna ${cell.position.x+1}`}
            onClick={e=>{
              if(freePlay)onCellActivate?.(e,cell.position,placed?.pieceId);
              else if(official && placed && placed.pieceId!==selectedPieceId && pieces.some(p=>p.id===selectedPieceId))onSelectPiece?.(placed.pieceId);
              else if(selectedPieceId)onPieceDrop(selectedPieceId,cell.position);
              else if(placed)onSelectPiece?.(placed.pieceId);
            }}
            onPointerDown={e=>{if(placed && freePlay)onPiecePointerDown?.(e,placed.pieceId,cell.position);}}
            onDragStart={e=>{if(placed && piece){onSelectPiece?.(placed.pieceId);e.dataTransfer.setData(TETRIMINO_DND_TYPE,JSON.stringify({pieceId:placed.pieceId,offset:{x:cell.position.x-piece.position.x,y:cell.position.y-piece.position.y}}));e.dataTransfer.effectAllowed="move";}}}
            onDragOver={dragOver} onDrop={e=>drop(e,cell.position)}
            onKeyDown={e=>{if(!freePlay && placed && e.key.toLowerCase()==="r"){e.preventDefault();e.stopPropagation();onRotatePiece(placed.pieceId);}}}
            onContextMenu={e=>{e.preventDefault();if(placed&&!disabled){if(freePlay)e.stopPropagation();onRotatePiece(placed.pieceId,freePlay?cell.position:undefined);}}}>
            {cell.blocked?<LockKeyhole size={16} aria-hidden="true"/>:placed?<span className={pieceNumbers?"tetri-board-piece-number":undefined} aria-hidden="true">{pieceNumbers?(showNumber?pieceNumbers[placed.pieceId]:null):placed.type}</span>:required?<span className="tetri-required" aria-hidden="true">●</span>:official?<span className="tetri-cell-center" aria-hidden="true"/>:null}
          </button>;
        }))}
        {freePlay && <svg className="tetri-free-outlines" viewBox={`0 0 ${board.size.cols} ${board.size.rows}`} preserveAspectRatio="none" aria-hidden="true">
          {pieces.filter(p=>p.id!==hiddenPieceId).map(piece=><PieceSurface key={piece.id} piece={piece} selected={selectedPieceId===piece.id} x={piece.position.x} y={piece.position.y}/>)}
        </svg>}
      </div>
    </div>
  </div>;
};
