import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCw, Undo2, Lightbulb, CircleCheck, RotateCcw, HelpCircle, Check, LockKeyhole } from "lucide-react";
import type { LevelConfig, Piece, RotationAngle } from "../../../shared/types/TetriLogic";
import type { ActivityResponseDTO } from "../../../infrastructure/api/models/apiModels";
import { createBoard, createInventory, placementError, rotate, solutionError } from "../../../application/usecases/tetrilogic/rules";
import { useGameStore } from "../../../infrastructure/store/gameStore";
import { Board } from "./Board";
import { PieceTray } from "./PieceTray";
import { TetriLogicInstructions, TetriLogicRules } from "./TetriLogicRules";
import { Modal } from "../common/Modal";
import "./tetrilogic.css";

export function OfficialTetriLogicStage({ level, activity, index, levels, onLevel, onNext }: {
  level: LevelConfig;
  activity?: ActivityResponseDTO;
  index: number;
  levels: LevelConfig[];
  onLevel: (n: number) => void;
  onNext?: () => void;
}) {
  const [inventory, setInventory] = useState(() => createInventory(level));
  const [placed, setPlaced] = useState<Piece[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [checks, setChecks] = useState(0);
  const [hint, setHint] = useState<"general" | "specific" | null>(null);
  const [hintCount, setHintCount] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const status = useGameStore(s => s.status);
  const moves = useGameStore(s => s.movimientos);
  const time = useGameStore(s => s.tiempoResolucion);
  const resets = useGameStore(s => s.reinicios);
  const playing = status === "PLAYING";
  useEffect(() => {
    useGameStore.getState().startGame("tetrilogic");
    return () => useGameStore.getState().stopGame();
  }, []);
  const board = createBoard(level, placed);
  const pieceNumbers = Object.fromEntries(level.inventory!.map((p, i) => [p.id, i + 1]));
  const selectedPiece = [...inventory, ...placed].find(p => p.id === selected);
  const move = () => useGameStore.getState().registerMove();
  const readable = (message: string) => {
    for (const [id, number] of Object.entries(pieceNumbers)) {
      message = message.replace(new RegExp(`\\b${id}\\b`, "gi"), `la pieza ${number}`);
    }
    return message.charAt(0).toUpperCase() + message.slice(1);
  };
  function selectPiece(id: string) {
    if (!playing) return;
    setSelected(id); setFeedback(`Pieza ${pieceNumbers[id]} seleccionada.`);
  }
  function drop(id: string, position: { x: number; y: number }) {
    if (!playing) return;
    const piece = [...inventory, ...placed].find(p => p.id === id);
    if (!piece) return;
    if (placed.some(p => p.id === id && p.position.x === position.x && p.position.y === position.y)) return;
    const next = { ...piece, position };
    const error = placementError(level, placed, next);
    if (error) { setFeedback(readable(error)); return; }
    setPlaced([...placed.filter(p => p.id !== id), next]);
    setInventory(inventory.filter(p => p.id !== id)); setSelected(id);
    setFeedback(`Pieza ${pieceNumbers[id]} colocada.`); move();
  }
  function rotatePiece(id: string) {
    if (!playing) return;
    const piece = [...inventory, ...placed].find(p => p.id === id);
    if (!piece) return;
    if (piece.type === "O") { setFeedback("Esta pieza conserva su forma al girar."); return; }
    const next = { ...piece, shape: rotate(piece.shape), rotation: ((piece.rotation + 90) % 360) as RotationAngle };
    if (placed.some(p => p.id === id)) {
      const error = placementError(level, placed, next);
      if (error) { setFeedback("El giro no cabe aquí. Devuelve la pieza para girarla."); return; }
      setPlaced(placed.map(p => p.id === id ? next : p));
    } else setInventory(inventory.map(p => p.id === id ? next : p));
    setSelected(id); setFeedback(`Pieza ${pieceNumbers[id]}: ${next.rotation}°.`); move();
  }
  function remove() {
    if (!playing) return;
    const piece = placed.find(p => p.id === selected);
    if (!piece) return;
    const dependent = level.precedences?.find(e => e.before === piece.id && placed.some(p => p.id === e.after));
    if (dependent) {
      setFeedback(`Devuelve primero la pieza ${pieceNumbers[dependent.after]}, que depende de la pieza ${pieceNumbers[piece.id]}.`); return;
    }
    setPlaced(placed.filter(p => p.id !== piece.id));
    setInventory([...inventory, { ...piece, position: { x: -1, y: -1 } }]);
    setFeedback("Pieza devuelta al inventario."); move();
  }
  function check() {
    if (!playing) return;
    const error = solutionError(level, placed);
    if (error) { setChecks(c => c + 1); setFeedback(readable(error)); return; }
    setFeedback("¡Todas las piezas y restricciones están resueltas!");
    useGameStore.getState().completeGame("SUCCESS");
  }
  function reset() {
    useGameStore.getState().resetGame({ preserveMetrics: true });
    setInventory(createInventory(level)); setPlaced([]); setSelected(null); setConfirmReset(false);
    setFeedback("Tablero reiniciado. Se conservan las métricas de este intento.");
  }
  function reveal(kind: "general" | "specific") {
    if (!playing) return;
    setHint(kind); setHintCount(c => c + 1);
  }
  function retry() {
    useGameStore.getState().startGame("tetrilogic");
    setInventory(createInventory(level)); setPlaced([]); setSelected(null);
    setFeedback(""); setChecks(0); setHint(null); setHintCount(0);
  }
  const specificLabel = `Pista específica${checks < 3 ? ` (${checks}/3 comprobaciones)` : ""}`;
  return <main className="lab-shell tetri-official" onKeyDown={e => {
    if (confirmReset || helpOpen || e.target instanceof HTMLSelectElement || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    const key = e.key.toLowerCase();
    if (key === "escape") { setSelected(null); setFeedback("Selección cancelada."); }
    if (key === "r" && selected) { e.preventDefault(); rotatePiece(selected); }
    if (key === "h") { e.preventDefault(); reveal("general"); }
    if (key === "n" && playing) { e.preventDefault(); setConfirmReset(true); }
    if (key === "enter" && !(e.target instanceof HTMLButtonElement) && !(e.target instanceof HTMLAnchorElement) && !(e.target instanceof HTMLElement && e.target.closest("summary"))) { e.preventDefault(); check(); }
  }}>
    <header className="tetri-heading">
      <div className="tetri-title-row"><div className="tetri-title-group"><Link to="/" className="tetri-back" aria-label="← Mis cursos" title="Mis cursos"><ArrowLeft size={20} aria-hidden="true" /></Link><h1>{activity?.name ?? level.title}</h1></div><button className="tetri-help-button" aria-label="Cómo jugar" onClick={() => setHelpOpen(true)}><HelpCircle size={18} aria-hidden="true" /><span>Cómo jugar</span></button></div>
      <p className="tetri-intro">Usa todas las piezas y completa los números de los bordes.</p>
    </header>
    <section className="tetri-workbench" aria-label="Área de simulación">
      <div className="tetri-workbench-top">
        <span className="tetri-mode">{level.title}</span><span className="tetri-board-size">{level.boardSize.rows} × {level.boardSize.cols} · {level.inventory!.length} piezas</span>
        {!activity && <label className="tetri-level-picker">Reto <select aria-label="Seleccionar nivel" value={index} onChange={e => onLevel(Number(e.target.value))}>{levels.map((l, i) => <option key={l.templateId} value={i}>{l.level}. {l.title}</option>)}</select></label>}
      </div>
      <div className="tetri-layout">
        <aside className="tetri-brief"><TetriLogicRules level={level} pieceNumbers={pieceNumbers} /></aside>
        <div className="tetri-board-panel">
          <div className="tetri-panel-title"><h2>Tablero</h2><span>Celdas / meta</span></div>
          <Board board={board} pieces={placed} level={level} pieceNumbers={pieceNumbers} disabled={!playing} onPieceDrop={drop} onRotatePiece={rotatePiece} selectedPieceId={selected} onSelectPiece={selectPiece} />
          <div className="tetri-board-legend"><span><i className="tetri-legend-required" aria-hidden="true" />Cubrir</span><span><LockKeyhole size={13} aria-hidden="true" />No ocupar</span><span><Check size={13} aria-hidden="true" />Completo</span></div>
        </div>
        <aside className="tetri-inventory-panel">
          <div className="tetri-panel-title"><h2>Piezas</h2><span>{inventory.length}/{level.inventory!.length}</span></div>
          {inventory.length ? <PieceTray pieces={inventory} pieceNumbers={pieceNumbers} selectedPieceId={selected} disabled={!playing} onRotatePiece={rotatePiece} onSelectPiece={selectPiece} /> : <p className="tetri-inventory-empty"><Check size={24} aria-hidden="true" />Todas colocadas</p>}
          <p className="tetri-selection">{selectedPiece ? `Pieza ${pieceNumbers[selectedPiece.id]} · ${selectedPiece.rotation}°` : "Selecciona o arrastra"}</p>
          <div className="tetri-piece-actions">
            <button aria-label="Rotar pieza" aria-keyshortcuts="R" className="btn-secondary" disabled={!playing || !selectedPiece} onClick={() => { if (selected) rotatePiece(selected); }}><RotateCw size={16} aria-hidden="true" />Rotar <kbd aria-hidden="true">R</kbd></button>
            <button aria-label="Devolver pieza" className="btn-secondary" disabled={!playing || !placed.some(p => p.id === selected)} onClick={remove}><Undo2 size={16} aria-hidden="true" />Devolver</button>
            <button aria-label="Cancelar selección" aria-keyshortcuts="Escape" className="tetri-cancel" disabled={!selected} onClick={() => { setSelected(null); setFeedback("Selección cancelada."); }}>Cancelar <kbd aria-hidden="true">Esc</kbd></button>
          </div>
        </aside>
      </div>
      <div className="tetri-bottom">
        <p role="status" className="tetri-feedback">{feedback || "Selecciona una pieza y elige dónde colocarla."}</p>
        <div className="tetri-actions">
          <button className="btn-premium" disabled={!playing} onClick={check}><CircleCheck size={18} aria-hidden="true" />Comprobar</button>
          <button className="btn-secondary" disabled={!playing} onClick={() => setConfirmReset(true)}><RotateCcw size={18} aria-hidden="true" />Reiniciar</button><span className="tetri-actions-divider" />
          <button className="btn-secondary" disabled={!playing} onClick={() => reveal("general")}><Lightbulb size={18} aria-hidden="true" />Pista general</button>
          <button className="btn-secondary" aria-label={specificLabel} title="Se habilita tras tres comprobaciones incorrectas" disabled={!playing || checks < 3} onClick={() => reveal("specific")}>Pista específica{checks < 3 && <span aria-hidden="true">{checks}/3</span>}</button>
        </div>
        {hint && <aside className="tetri-hint" aria-label="Pista estática"><strong>{hint === "general" ? "Pista general" : "Pista específica"}</strong><p>{readable(level.hints?.[hint] ?? "")}</p><button onClick={() => setHint(null)}>Ocultar pista</button></aside>}
        <dl className="tetri-metrics">{[["Tiempo", `${Math.floor(time / 60)}:${String(time % 60).padStart(2, "0")}`], ["Movimientos", moves], ["Reinicios", resets], ["Ayudas", hintCount]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      </div>
      {status === "SUCCESS" && <section className="tetri-result" aria-label="Resultado del reto"><h2>¡Reto completado!</h2><p>Has cumplido los conteos y las reglas del tablero.</p><div>
        {onNext ? <button className="btn-premium" onClick={onNext}>Siguiente reto</button> : !activity && index < levels.length - 1 && <button className="btn-premium" onClick={() => onLevel(index + 1)}>Siguiente reto</button>}
        <button className="btn-secondary" onClick={retry}>Volver a intentar</button><Link to="/" className="btn-secondary">Volver a mis cursos</Link>
      </div></section>}
    </section>
    {activity && <TetriLogicInstructions description={activity.description} missions={activity.missions} defaultDescription={level.description} />}
    <Modal title="Cómo jugar" isOpen={helpOpen} onClose={() => setHelpOpen(false)} maxWidth="max-w-xl"><div className="tetri-help-content">
      <h2>Cómo jugar</h2><p>Usa todas las piezas. No hace falta llenar el tablero.</p>
      <dl>
        <dt>Números de los bordes</dt><dd>2/4 significa que has ocupado 2 casillas de las 4 que exige esa fila o columna. Todos deben coincidir al terminar, también los ceros.</dd>
        <dt>Puntos y bloqueos</dt><dd>Cubre los puntos. Las casillas con candado deben quedar libres. Las piezas no pueden superponerse ni salir del tablero.</dd>
        <dt>Orden</dt><dd>La flecha indica qué pieza debe entrar primero. Después puedes moverla. Para devolver una pieza al inventario, retira antes las que dependan de ella.</dd>
        <dt>Contacto y giro</dt><dd>Las parejas indicadas deben compartir al menos un lado al terminar; una esquina no basta. Si se muestra un giro final, termina en una de esas posiciones.</dd>
        <dt>Controles</dt><dd>Arrastra o selecciona una pieza y pulsa su casilla de inicio. Gira con R, clic derecho o Rotar. Usa Cancelar o Esc para soltar la selección.</dd>
        <dt>Comprobar y ayudas</dt><dd>Puedes probar posiciones aunque los números no coincidan todavía. Comprobar revisa el resultado; la pista específica se habilita tras tres comprobaciones incorrectas.</dd>
        <dt>Movimientos</dt><dd>Colocar, mover, girar y devolver suman movimientos. La referencia de este tablero es {level.referenceMoves}; es orientativa, no un mínimo ni un límite para ganar.</dd>
      </dl>
    </div></Modal>
    <Modal title="Reiniciar el tablero" isOpen={confirmReset} onClose={() => setConfirmReset(false)} maxWidth="max-w-md"><div className="tetri-help-content"><h2>¿Reiniciar el tablero?</h2><p>Las piezas volverán al inventario. Se conservan el tiempo, los movimientos, las comprobaciones y las ayudas de este intento.</p><div className="tetri-dialog-actions"><button className="btn-secondary" onClick={() => setConfirmReset(false)}>Seguir jugando</button><button className="btn-premium" onClick={reset}>Reiniciar tablero</button></div></div></Modal>
  </main>;
}
