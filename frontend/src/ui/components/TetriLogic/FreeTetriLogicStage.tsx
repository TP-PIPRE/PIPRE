import { useEffect, useReducer, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Lightbulb, RotateCw, RotateCcw, Undo2 } from "lucide-react";
import type { LevelConfig } from "../../../shared/types/TetriLogic";
import { TETRILOGIC_TIPS } from "../../../shared/constants/boardTips";
import type { ActivityResponseDTO } from "../../../infrastructure/api/models/apiModels";
import { createBoard } from "../../../application/usecases/tetrilogic/rules";
import { freePlayReducer, isPlaced } from "../../../application/usecases/tetrilogic/freePlay";
import { restoreTetriBoard } from "../../../application/usecases/restoreBoard";
import type { FreePlayAction } from "../../../application/usecases/tetrilogic/freePlay";
import type { Piece } from "../../../shared/types/TetriLogic";
import { useAttemptTrace } from "../common/useAttemptTrace";
import { useValidatedGameSession } from "../common/useValidatedGameSession";
import { useBoardHint } from "../common/useBoardHint";
import { useProgressiveHint } from "../common/useProgressiveHint";
import { AdditionalAdviceModal } from "../common/AdditionalAdviceModal";
import { HintToast } from "../common/HintToast";
import { GameSessionFeedback } from "../common/GameSessionFeedback";
import { lineGoalsMet } from "../../../application/usecases/tetrilogic/lineGoals";
import { Board } from "./Board";
import { PieceTray } from "./PieceTray";
import { PieceGhost } from "./PieceSurface";
import { useFreePieceInteraction } from "./useFreePieceInteraction";
import { Modal } from "../common/Modal";
import "./tetrilogic.css";
import "./freePlay.css";

type Props={
  level: LevelConfig; levels: LevelConfig[]; index: number; onLevel: (index: number) => void; activity?: ActivityResponseDTO; dailyChallengeId?: string; onNext?: () => void;
};
export function FreeTetriLogicStage(props:Props) {
  const {level,activity,dailyChallengeId}=props;
  const templateId=activity?.levelTemplate??level.templateId;
  const gameSession=useValidatedGameSession(templateId?{game:"tetrilogic",levelTemplate:templateId,activityId:activity?.idActivity,dailyChallengeId}:null);
  if(!gameSession.ready)return <main className="lab-shell"><h1>{activity?.name??"TetriLogic"}</h1><GameSessionFeedback state={gameSession.state} retry={gameSession.retry} onNewAttempt={gameSession.restart}/></main>;
  return <TetriBoardSession key={gameSession.state?.session?.sessionId??templateId} {...props} gameSession={gameSession}/>;
}
function TetriBoardSession({level,levels,index,onLevel,activity,dailyChallengeId,onNext,gameSession}:Props&{gameSession:ReturnType<typeof useValidatedGameSession>}) {
  const [state, dispatch] = useReducer(freePlayReducer,undefined,()=>restoreTetriBoard(level,gameSession.state?.session?.state.pieces));
  const [confirmReset, setConfirmReset] = useState(false);
  const hintButton = useRef<HTMLButtonElement>(null);
  const hintNotice = useRef<HTMLDivElement>(null);
  const rotateButton = useRef<HTMLButtonElement>(null);
  const returnButton = useRef<HTMLButtonElement>(null);
  const [initialTrace]=useState(gameSession.state?.session?.state.pieces??[]);
  const templateId=activity?.levelTemplate??level.templateId;
  const {record,finish}=useAttemptTrace(templateId && dailyChallengeId?.length !== 36 ?{game:'tetrilogic',activityId:activity?.idActivity,levelTemplate:templateId,templateVersion:level.version??1,ruleset:'tetrilogic-counts-v1'}:null,initialTrace);
  const legacyHint = useBoardHint(gameSession, record, TETRILOGIC_TIPS);
  const session = gameSession.state?.session;
  const progressive = session?.state.progressiveTutor === true;
  const progressiveHint = useProgressiveHint(progressive ? session.sessionId : undefined, gameSession.hintScope, gameSession.prepareProgressiveHint, record);
  const hint = progressive ? progressiveHint : legacyHint;
  const tutorPaused = progressive && (progressiveHint.busy || progressiveHint.confirmation !== undefined);
  const snapshot=(pieces:Piece[])=>pieces.filter(isPlaced).map(p=>({id:p.id,type:p.type,x:p.position.x,y:p.position.y,rotation:p.rotation}));
  const trackedDispatch=(action:FreePlayAction)=>{
    if (tutorPaused) return;
    const next=freePlayReducer(state,action);
    if(action.type==='select')record('SELECT',action.id?{pieceId:action.id}:{});
    else if(action.type==='reset'){record('RESET',{},snapshot(state.pieces),snapshot(next.pieces));hint.reset();gameSession.reset();}
    else if(['place','rotate','return'].includes(action.type)&&'id' in action) {
      const piece=next.pieces.find(p=>p.id===action.id);
      if(next.pieces===state.pieces){record('REJECT',{pieceId:action.id,errorCode:'BOUNDS_OR_COLLISION'});gameSession.action({type:"REJECT",pieceId:action.id});}
      else if(piece){
        if (action.type !== 'rotate' || isPlaced(piece)) {
          if (hintNotice.current?.contains(document.activeElement)) rotateButton.current?.focus({ preventScroll: true });
          hint.close();
        }
        if (action.type === 'return' && document.activeElement === returnButton.current) rotateButton.current?.focus();
        const type=action.type==='place'?'PLACE':action.type==='rotate'?'ROTATE':'RETURN';
        record(type,{pieceId:piece.id,pieceType:piece.type,x:piece.position.x,y:piece.position.y,rotation:piece.rotation},snapshot(state.pieces),snapshot(next.pieces));
        gameSession.action(type==="RETURN"?{type,pieceId:piece.id}:{type,pieceId:piece.id,x:piece.position.x,y:piece.position.y,rotation:piece.rotation});
      }
    } else if(action.type==='message'&&action.message)record('CANCEL');
    dispatch(action);
  };
  const { boardRef, trayRef, preview, begin, activateCell, activateTray, rotatePiece, returnPiece, reset, cancelInteraction, rootEvents } = useFreePieceInteraction(state, trackedDispatch,{
    onDraftRotate:(id,rotation)=>{record('ROTATE',{pieceId:id,rotation,source:'DRAFT'});gameSession.action({type:"ROTATE",pieceId:id,rotation,source:"DRAFT"});},
    onRejectedDrop:outside=>{record('REJECT',{errorCode:outside?'OUTSIDE':'BOUNDS_OR_COLLISION'});gameSession.action({type:"REJECT"});},
  });
  const placed = state.pieces.filter(isPlaced);
  const available = state.pieces.filter(p => !isPlaced(p));
  // Keep published content immutable; this experience only restores its row/column goals.
  const board = createBoard({ ...level, blockedCells: [] }, placed);
  const pieceNumbers = Object.fromEntries(state.pieces.map((p, i) => [p.id, i + 1]));
  const selected = state.pieces.find(p => p.id === state.selectedId);
  const changed = state.pieces.some(p => isPlaced(p) || p.rotation !== 0);
  const completed = lineGoalsMet(level, state.pieces);
  useEffect(()=>{if(completed)finish('SUCCESS');},[completed,finish]);
  const confirmVictory=gameSession.complete;
  useEffect(()=>{if(completed)confirmVictory();},[completed,confirmVictory]);
  if(!gameSession.ready)return <main className="lab-shell"><h1>{activity?.name??"TetriLogic"}</h1><GameSessionFeedback state={gameSession.state} retry={gameSession.retry} onNewAttempt={gameSession.restart}/></main>;
  return <main className="lab-shell tetri-free" {...(tutorPaused ? undefined : rootEvents)} onKeyDown={event => {
    if (!tutorPaused && !confirmReset) rootEvents.onKeyDown(event);
  }}>
    <header className="tetri-free-heading">
      <div className="tetri-free-title"><Link to="/" aria-label="Volver a mis cursos" className="tetri-back" title="Mis cursos"><ArrowLeft size={20} aria-hidden="true" /></Link>
        <div><p className="tetri-free-eyebrow">Filas y columnas</p><h1>{activity?.name ?? "TetriLogic"}</h1></div>
      </div>
      {!activity && !dailyChallengeId && <label className="tetri-free-picker">Tablero<select aria-label="Seleccionar tablero" value={index} disabled={gameSession.verifying || (gameSession.enabled && completed && !gameSession.state?.victory)} onChange={e => onLevel(Number(e.target.value))}>{levels.map((config, i) => <option key={config.templateId ?? i} value={i}>{i + 1} · {config.boardSize.cols} × {config.boardSize.rows}</option>)}</select></label>}
    </header>
    <section className="tetri-free-workspace" aria-label="Reto de filas y columnas">
      <div className="tetri-free-canvas">
        <h2 className="sr-only">Tablero</h2>
        <Board board={board} pieces={placed} freePlay disabled={tutorPaused} lineGoals={level.constraints} boardRef={boardRef}
          pieceNumbers={pieceNumbers} selectedPieceId={state.selectedId}
          hiddenPieceId={preview?.dragging ? preview.piece.id : undefined}
          onPieceDrop={(id, position) => trackedDispatch({ type: "place", id, position })}
          onRotatePiece={rotatePiece} onCellActivate={activateCell} onPiecePointerDown={tutorPaused ? undefined : begin} />
      </div>
      <aside ref={trayRef} className="tetri-free-tray" data-drop-active={preview?.dragging && preview.overTray} aria-label="Bandeja de piezas">
        <h2>Piezas</h2>
        <PieceTray pieces={available} slots={state.pieces} pieceNumbers={pieceNumbers} selectedPieceId={state.selectedId}
          disabled={tutorPaused} pointerInteraction onRotatePiece={rotatePiece} onPiecePointerDown={tutorPaused ? undefined : begin} onPieceActivate={activateTray} />
        <div className="tetri-free-piece-tools">
          <button ref={rotateButton} type="button" className="btn-secondary" aria-label="Rotar pieza" title="Girar (R)" disabled={tutorPaused || !selected} onClick={() => rotatePiece()}><RotateCw size={18} aria-hidden="true" />Girar <kbd aria-hidden="true">R</kbd></button>
          <button ref={returnButton} type="button" className="btn-secondary" aria-label="Devolver pieza" title="Devolver a la bandeja (Supr)" disabled={tutorPaused || !selected || !isPlaced(selected)} onClick={returnPiece}><Undo2 size={18} aria-hidden="true" />Devolver</button>
        </div>
      </aside>
      <footer className="tetri-free-footer">
        <p role="status" aria-live="polite" className="tetri-goal-feedback" data-complete={completed}>{completed ? <><CheckCircle2 size={18} aria-hidden="true" /><span><strong>Reto completado.</strong> Todas las filas y columnas coinciden.</span></> : state.message || "Iguala los conteos de filas y columnas: ocupadas / objetivo."}</p>
        <div className="flex flex-wrap items-center gap-3">
          <button ref={hintButton} type="button" className="btn-secondary aria-disabled:opacity-50"
            aria-describedby="tetri-hint-count" aria-disabled={hint.busy || undefined}
            disabled={completed || gameSession.verifying || Boolean(gameSession.state?.victory)}
            onClick={() => {
              if (tutorPaused || hint.busy) return;
              if (progressive) cancelInteraction();
              void hint.request();
            }}>
            <Lightbulb size={16} aria-hidden="true" />Pista
          </button>
          <button type="button" className="tetri-free-reset" disabled={tutorPaused||(!changed&&!gameSession.state?.victory)||gameSession.verifying} onClick={() => setConfirmReset(true)}><RotateCcw size={16} aria-hidden="true" />Restablecer</button>
        </div>
        <p className="tetri-free-shortcuts"><kbd>R</kbd> girar <span aria-hidden="true">·</span> <kbd>Esc</kbd> cancelar</p>
        <div className="col-span-full space-y-2">
          <p id="tetri-hint-count" className="text-sm text-text-muted">{gameSession.enabled && !progressive && "Usar pistas puede afectar las estrellas. "}Pistas usadas: {hint.count}.</p>
          {hint.busy && <p role="status">Consultando pista…</p>}
          {hint.message && <div ref={hintNotice}><HintToast message={hint.message} onClose={() => {
              hintButton.current?.focus({ preventScroll: true });
              hint.close();
            }} /></div>}
        </div>
      </footer>
    </section>
    <GameSessionFeedback state={gameSession.state} retry={progressive ? gameSession.retry : legacyHint.retry} onNewAttempt={gameSession.restart}/>
    {gameSession.state?.victory && onNext && <button type="button" className="btn-premium" onClick={onNext}>Siguiente reto</button>}
    {preview && createPortal(<div className="tetri-free-preview-layer" aria-hidden="true"><div className="tetri-free-preview"
      data-valid={preview.valid} data-over-board={Boolean(preview.position)} data-over-tray={preview.overTray}
      style={{ left: preview.left, top: preview.top }}><PieceGhost piece={preview.piece} cellSize={preview.cell} /></div></div>, document.body)}
    <Modal title="Restablecer tablero" isOpen={confirmReset} onClose={() => setConfirmReset(false)} maxWidth="max-w-md">
      <div className="tetri-help-content"><h2>¿Restablecer el tablero?</h2><p>Las piezas volverán a la bandeja con su giro inicial.</p><div className="tetri-dialog-actions"><button className="btn-secondary" onClick={() => setConfirmReset(false)}>Continuar</button><button className="btn-premium" onClick={() => { reset(); setConfirmReset(false); }}>Restablecer tablero</button></div></div>
    </Modal>
    <AdditionalAdviceModal isOpen={progressiveHint.confirmation !== undefined} onCancel={progressiveHint.cancel} onConfirm={progressiveHint.confirm} />
  </main>;
}
