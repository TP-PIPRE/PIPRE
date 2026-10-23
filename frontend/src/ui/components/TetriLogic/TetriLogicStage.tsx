import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Board, BoardCell, Cell, LevelConfig, Piece, RotationAngle } from "../../../shared/types/TetriLogic";
import { TETRILOGIC_LEVELS } from "../../../shared/constants/levelConfigs";
import { validatePlacement } from "../../../application/usecases/tetrilogic/validatePlacement";
import { useGameStore } from "../../../infrastructure/store/gameStore";
import { Board as BoardView } from "./Board";
import { PieceTray } from "./PieceTray";
import { ControlPanel } from "../common/ControlPanel";
import { AiFeedbackToast } from "../common/AiFeedbackToast";

const LEVELS = TETRILOGIC_LEVELS;
const HINT_MESSAGE = "IA: Intenta rotar la pieza T (click derecho) para encajarla en la esquina superior.";

const createInventory = (): Piece[] => [
  { id: "o1", type: "O", rotation: 0, position: { x: -1, y: -1 }, shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] },
  { id: "i1", type: "I", rotation: 0, position: { x: -1, y: -1 }, shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }] },
  { id: "t1", type: "T", rotation: 0, position: { x: -1, y: -1 }, shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }] },
  { id: "s1", type: "S", rotation: 0, position: { x: -1, y: -1 }, shape: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] },
];

const createBoard = (level: LevelConfig): Board => {
  const { rows, cols } = level.boardSize;
  const cells: BoardCell[][] = Array.from({ length: rows }, (_, y) =>
    Array.from({ length: cols }, (_, x) => ({
      position: { x, y },
      blocked: level.blockedCells.some((c) => c.x === x && c.y === y),
      tetriminoType: null,
    })),
  );
  return { size: { rows, cols }, cells, blockedCells: level.blockedCells };
};

const rebuildBoard = (board: Board, placed: Piece[]): Board => {
  const cells: BoardCell[][] = board.cells.map((row) =>
    row.map((cell): BoardCell => ({ ...cell, tetriminoType: null })),
  );
  for (const piece of placed) {
    for (const offset of piece.shape) {
      const x = piece.position.x + offset.x;
      const y = piece.position.y + offset.y;
      const target = cells[y]?.[x];
      if (target) target.tetriminoType = piece.type;
    }
  }
  return { ...board, cells };
};

const rotateShape = (shape: Cell[]): Cell[] =>
  shape.map(({ x, y }) => ({ x: -y, y: x }));

export const TetriLogicStage: React.FC = () => {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [board, setBoard] = useState<Board>(() => createBoard(LEVELS[0]));
  const [inventory, setInventory] = useState<Piece[]>(createInventory);
  const [placed, setPlaced] = useState<Piece[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const level = LEVELS[currentLevelIndex];

  const status = useGameStore((s) => s.status);
  const startGame = useGameStore((s) => s.startGame);
  const registerMove = useGameStore((s) => s.registerMove);
  const completeGame = useGameStore((s) => s.completeGame);

  useEffect(() => {
    startGame("tetrilogic");
    return () => {
      useGameStore.getState().stopGame();
    };
  }, [startGame]);

  const resetForLevel = (index: number) => {
    setBoard(createBoard(LEVELS[index]));
    setPlaced([]);
    setInventory(createInventory());
    setHint(null);
    setFeedback("");
    setSelectedPieceId(null);
  };

  const handleLevelChange = (index: number) => {
    setCurrentLevelIndex(index);
    resetForLevel(index);
    startGame("tetrilogic");
  };

  const handleNextLevel = () => {
    const next = currentLevelIndex + 1;
    if (next >= LEVELS.length) return;
    setCurrentLevelIndex(next);
    resetForLevel(next);
    startGame("tetrilogic");
  };

  const handlePieceDrop = (pieceId: string, cell: Cell) => {
    const piece = [...inventory, ...placed].find((p) => p.id === pieceId);
    if (!piece) return;

    const withoutOld = placed.filter((p) => p.id !== pieceId);
    const boardWithout = rebuildBoard(board, withoutOld);

    if (!validatePlacement(boardWithout, piece, cell)) { setFeedback("La pieza no cabe aquí. Elige otra celda libre."); return; }
    setFeedback("Pieza colocada.");

    const nextPlaced = [...withoutOld, { ...piece, position: cell }];
    setPlaced(nextPlaced);
    setBoard(rebuildBoard(board, nextPlaced));
    setInventory((inv) => inv.filter((p) => p.id !== pieceId));
    registerMove();
  };

  const handleRotatePiece = (pieceId: string) => {
    const piece = placed.find((p) => p.id === pieceId);
    if (!piece) return;

    const rotated: Piece = {
      ...piece,
      shape: rotateShape(piece.shape),
      rotation: ((piece.rotation + 90) % 360) as RotationAngle,
    };

    const withoutOld = placed.filter((p) => p.id !== pieceId);
    const boardWithout = rebuildBoard(board, withoutOld);

    if (!validatePlacement(boardWithout, rotated, piece.position)) return;

    const nextPlaced = [...withoutOld, rotated];
    setPlaced(nextPlaced);
    setBoard(rebuildBoard(board, nextPlaced));
    registerMove();
  };

  const checkConstraints = () => {
    const { rows, cols } = level.boardSize;
    const rowCounts = Array.from({ length: rows }, () => 0);
    const colCounts = Array.from({ length: cols }, () => 0);

    for (const piece of placed) {
      for (const offset of piece.shape) {
        rowCounts[piece.position.y + offset.y]++;
        colCounts[piece.position.x + offset.x]++;
      }
    }

    return level.constraints.every((c) =>
      (c.orientation === "row" ? rowCounts[c.line] : colCounts[c.line]) === c.targetCount,
    );
  };

  const handleCheck = () => {
    if (!checkConstraints()) { setFeedback("Revisa los objetivos de filas y columnas antes de volver a comprobar."); return; }
    setFeedback("¡Objetivos completados!");
    completeGame("SUCCESS");
  };

  return (
    <main className="lab-shell">
      <header className="lab-heading"><div><Link to="/" className="text-sm font-semibold text-primary">← Mis cursos</Link><h1>TetriLogic</h1><p className="page-intro">Coloca las piezas y cumple los objetivos de cada fila y columna.</p></div><span className="text-sm text-text-muted">Nivel {level.level} de {LEVELS.length}</span></header>
      <section className="lab-stage" aria-label="Área de simulación">
      <div className="flex w-full items-center justify-between gap-4 border-b border-border pb-4">
        <label className="text-sm font-semibold text-text-muted">Nivel</label>
        <select
          value={currentLevelIndex}
          onChange={(e) => handleLevelChange(Number(e.target.value))}
          aria-label="Seleccionar nivel"
          className="rounded-lg bg-surface border border-border px-3 py-1.5 text-sm font-semibold text-text">
          {LEVELS.map((l, i) => (
            <option key={l.level} value={i}>
              Nivel {l.level}
            </option>
          ))}
        </select>
      </div>

      <BoardView
        board={board}
        pieces={placed}
        onPieceDrop={handlePieceDrop}
        onRotatePiece={handleRotatePiece}
        selectedPieceId={selectedPieceId}
        onSelectPiece={setSelectedPieceId}
      />
      <p className="text-sm text-text-muted text-center">Selecciona una pieza y una celda para colocarla. Selecciona una pieza del tablero para moverla o rotarla.</p>
      <div className="lab-tools"><PieceTray pieces={inventory} selectedPieceId={selectedPieceId} onSelectPiece={setSelectedPieceId} /><button className="btn-secondary" disabled={!placed.some(p => p.id === selectedPieceId)} onClick={() => { if (selectedPieceId) handleRotatePiece(selectedPieceId); }}>Rotar pieza ↻</button></div>
      <div className="w-full rounded-lg border border-border p-3"><h2 className="text-sm font-semibold mb-2">Objetivos del nivel</h2><ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-muted">{level.constraints.map((c, i) => <li key={i}>{c.orientation === "row" ? "Fila" : "Columna"} {c.line + 1}: {c.targetCount} celdas</li>)}</ul></div>
      <p role="status" className="lab-status">{feedback || "Prepara el tablero y pulsa Comprobar para validar tu solución."}</p>
      <ControlPanel
        onCheck={handleCheck}
        onReset={() => resetForLevel(currentLevelIndex)}
        onHint={() => setHint(HINT_MESSAGE)}
      />
      {status === "SUCCESS" &&
        (currentLevelIndex === LEVELS.length - 1 ? (
          <div className="flex flex-wrap items-center justify-center gap-3 rounded-lg bg-primary/10 border border-primary px-4 py-2">
            <span className="text-sm font-bold text-primary">
              ¡Curso Completado!
            </span>
            <Link
              to="/"
              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
              Volver a mis cursos
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-3 rounded-lg bg-green-500/10 border border-green-500 px-4 py-2">
            <span className="text-sm font-bold text-success">
              ¡Nivel completado!
            </span>
            <button
              onClick={handleNextLevel}
              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
              Siguiente Nivel
            </button>
          </div>
        ))}
      {hint && (
        <div className="w-full flex justify-center">
          <AiFeedbackToast message={hint} onClose={() => setHint(null)} />
        </div>
      )}
      </section>
    </main>
  );
};
