import { useReducer, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, RotateCw, RotateCcw, Undo2 } from "lucide-react";
import type { LevelConfig } from "../../../shared/types/TetriLogic";
import type { ActivityResponseDTO } from "../../../infrastructure/api/models/apiModels";
import { createBoard } from "../../../application/usecases/tetrilogic/rules";
import { createFreePlay, freePlayReducer, isPlaced } from "../../../application/usecases/tetrilogic/freePlay";
import { lineGoalsMet } from "../../../application/usecases/tetrilogic/lineGoals";
import { Board } from "./Board";
import { PieceTray } from "./PieceTray";
import { PieceGhost } from "./PieceSurface";
import { useFreePieceInteraction } from "./useFreePieceInteraction";
import { Modal } from "../common/Modal";
import "./tetrilogic.css";
import "./freePlay.css";

export function FreeTetriLogicStage({ level, levels, index, onLevel, activity }: {
  level: LevelConfig; levels: LevelConfig[]; index: number; onLevel: (index: number) => void; activity?: ActivityResponseDTO;
}) {
  const [state, dispatch] = useReducer(freePlayReducer, level, createFreePlay);
  const [confirmReset, setConfirmReset] = useState(false);
  const { boardRef, trayRef, preview, begin, activateCell, activateTray, rotatePiece, returnPiece, reset, rootEvents } = useFreePieceInteraction(state, dispatch);
  const placed = state.pieces.filter(isPlaced);
  const available = state.pieces.filter(p => !isPlaced(p));
  // Keep published content immutable; this experience only restores its row/column goals.
  const board = createBoard({ ...level, blockedCells: [] }, placed);
  const pieceNumbers = Object.fromEntries(state.pieces.map((p, i) => [p.id, i + 1]));
  const selected = state.pieces.find(p => p.id === state.selectedId);
  const changed = state.pieces.some(p => isPlaced(p) || p.rotation !== 0);
  const completed = lineGoalsMet(level, state.pieces);
  return <main className="lab-shell tetri-free" {...rootEvents} onKeyDown={event => {
    if (!confirmReset) rootEvents.onKeyDown(event);
  }}>
    <header className="tetri-free-heading">
      <div className="tetri-free-title"><Link to="/" aria-label="Volver a mis cursos" className="tetri-back" title="Mis cursos"><ArrowLeft size={20} aria-hidden="true" /></Link>
        <div><p className="tetri-free-eyebrow">Filas y columnas</p><h1>{activity?.name ?? "TetriLogic"}</h1></div>
      </div>
      {!activity && <label className="tetri-free-picker">Tablero<select aria-label="Seleccionar tablero" value={index} onChange={e => onLevel(Number(e.target.value))}>{levels.map((config, i) => <option key={config.templateId ?? i} value={i}>{i + 1} · {config.boardSize.cols} × {config.boardSize.rows}</option>)}</select></label>}
    </header>
    <section className="tetri-free-workspace" aria-label="Reto de filas y columnas">
      <div className="tetri-free-canvas">
        <h2 className="sr-only">Tablero</h2>
        <Board board={board} pieces={placed} freePlay lineGoals={level.constraints} boardRef={boardRef}
          pieceNumbers={pieceNumbers} selectedPieceId={state.selectedId}
          hiddenPieceId={preview?.dragging ? preview.piece.id : undefined}
          onPieceDrop={(id, position) => dispatch({ type: "place", id, position })}
          onRotatePiece={rotatePiece} onCellActivate={activateCell} onPiecePointerDown={begin} />
      </div>
      <aside ref={trayRef} className="tetri-free-tray" data-drop-active={preview?.dragging && preview.overTray} aria-label="Bandeja de piezas">
        <h2>Piezas</h2>
        <PieceTray pieces={available} slots={state.pieces} pieceNumbers={pieceNumbers} selectedPieceId={state.selectedId}
          pointerInteraction onRotatePiece={rotatePiece} onPiecePointerDown={begin} onPieceActivate={activateTray} />
        <div className="tetri-free-piece-tools">
          <button type="button" className="btn-secondary" aria-label="Rotar pieza" title="Girar (R)" disabled={!selected} onClick={() => rotatePiece()}><RotateCw size={18} aria-hidden="true" />Girar <kbd aria-hidden="true">R</kbd></button>
          <button type="button" className="btn-secondary" aria-label="Devolver pieza" title="Devolver a la bandeja (Supr)" disabled={!selected || !isPlaced(selected)} onClick={returnPiece}><Undo2 size={18} aria-hidden="true" />Devolver</button>
        </div>
      </aside>
      <footer className="tetri-free-footer">
        <p role="status" aria-live="polite" className="tetri-goal-feedback" data-complete={completed}>{completed ? <><CheckCircle2 size={18} aria-hidden="true" /><span><strong>Reto completado.</strong> Todas las filas y columnas coinciden.</span></> : state.message || "Iguala los conteos de filas y columnas: ocupadas / objetivo."}</p>
        <button type="button" className="tetri-free-reset" disabled={!changed} onClick={() => setConfirmReset(true)}><RotateCcw size={16} aria-hidden="true" />Restablecer</button>
        <p className="tetri-free-shortcuts"><kbd>R</kbd> girar <span aria-hidden="true">·</span> <kbd>Esc</kbd> cancelar</p>
      </footer>
    </section>
    {preview && createPortal(<div className="tetri-free-preview-layer" aria-hidden="true"><div className="tetri-free-preview"
      data-valid={preview.valid} data-over-board={Boolean(preview.position)} data-over-tray={preview.overTray}
      style={{ left: preview.left, top: preview.top }}><PieceGhost piece={preview.piece} cellSize={preview.cell} /></div></div>, document.body)}
    <Modal title="Restablecer tablero" isOpen={confirmReset} onClose={() => setConfirmReset(false)} maxWidth="max-w-md">
      <div className="tetri-help-content"><h2>¿Restablecer el tablero?</h2><p>Las piezas volverán a la bandeja con su giro inicial.</p><div className="tetri-dialog-actions"><button className="btn-secondary" onClick={() => setConfirmReset(false)}>Continuar</button><button className="btn-premium" onClick={() => { reset(); setConfirmReset(false); }}>Restablecer tablero</button></div></div>
    </Modal>
  </main>;
}
