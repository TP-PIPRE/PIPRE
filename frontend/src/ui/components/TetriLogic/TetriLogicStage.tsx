import { useEffect, useState } from "react";
import type { Board, BoardCell, Cell, LineCountConstraint, Piece, RotationAngle } from "../../../shared/types/TetriLogic";
import { TETRILOGIC_LEVELS } from "../../../shared/constants/levelConfigs";
import { validatePlacement } from "../../../application/usecases/tetrilogic/validatePlacement";
import { useGameStore } from "../../../infrastructure/store/gameStore";
import { Board as BoardView } from "./Board";
import { PieceTray } from "./PieceTray";
import { ControlPanel } from "../common/ControlPanel";
import { AiFeedbackToast } from "../common/AiFeedbackToast";

const LEVEL = TETRILOGIC_LEVELS[0];
const HINT_MESSAGE = "IA: Intenta rotar la pieza T (click derecho) para encajarla en la esquina superior.";

const createInventory = (): Piece[] => [
  { id: "o1", type: "O", rotation: 0, position: { x: -1, y: -1 }, shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] },
  { id: "i1", type: "I", rotation: 0, position: { x: -1, y: -1 }, shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }] },
  { id: "t1", type: "T", rotation: 0, position: { x: -1, y: -1 }, shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }] },
  { id: "s1", type: "S", rotation: 0, position: { x: -1, y: -1 }, shape: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] },
];

const createBoard = (): Board => {
  const { rows, cols } = LEVEL.boardSize;
  const cells: BoardCell[][] = Array.from({ length: rows }, (_, y) =>
    Array.from({ length: cols }, (_, x) => ({
      position: { x, y },
      blocked: LEVEL.blockedCells.some((c) => c.x === x && c.y === y),
      tetriminoType: null,
    })),
  );
  return { size: { rows, cols }, cells, blockedCells: LEVEL.blockedCells };
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
  const [board, setBoard] = useState<Board>(createBoard);
  const [inventory, setInventory] = useState<Piece[]>(createInventory);
  const [placed, setPlaced] = useState<Piece[]>([]);
  const [constraints] = useState<LineCountConstraint[]>(() => LEVEL.constraints);
  const [hint, setHint] = useState<string | null>(null);

  const status = useGameStore((s) => s.status);
  const startGame = useGameStore((s) => s.startGame);
  const registerMove = useGameStore((s) => s.registerMove);
  const completeGame = useGameStore((s) => s.completeGame);

  useEffect(() => {
    startGame("tetrilogic");
  }, [startGame]);

  const handlePieceDrop = (pieceId: string, cell: Cell) => {
    const piece = [...inventory, ...placed].find((p) => p.id === pieceId);
    if (!piece) return;

    const withoutOld = placed.filter((p) => p.id !== pieceId);
    const boardWithout = rebuildBoard(board, withoutOld);

    if (!validatePlacement(boardWithout, piece, cell)) return;

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
    const { rows, cols } = LEVEL.boardSize;
    const rowCounts = Array.from({ length: rows }, () => 0);
    const colCounts = Array.from({ length: cols }, () => 0);

    for (const piece of placed) {
      for (const offset of piece.shape) {
        rowCounts[piece.position.y + offset.y]++;
        colCounts[piece.position.x + offset.x]++;
      }
    }

    return constraints.every((c) =>
      (c.orientation === "row" ? rowCounts[c.line] : colCounts[c.line]) === c.targetCount,
    );
  };

  const handleCheck = () => {
    if (!checkConstraints()) return;
    completeGame("SUCCESS");
  };

  const handleLocalReset = () => {
    setBoard(createBoard());
    setPlaced([]);
    setInventory(createInventory());
    setHint(null);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <BoardView
        board={board}
        pieces={placed}
        onPieceDrop={handlePieceDrop}
        onRotatePiece={handleRotatePiece}
      />
      <PieceTray pieces={inventory} />
      <ControlPanel
        onCheck={handleCheck}
        onReset={handleLocalReset}
        onHint={() => setHint(HINT_MESSAGE)}
      />
      {status === "SUCCESS" && (
        <div className="rounded-lg bg-green-500/10 border border-green-500 px-4 py-2 text-sm font-bold text-green-500">
          ¡Nivel completado!
        </div>
      )}
      {hint && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <AiFeedbackToast message={hint} onClose={() => setHint(null)} />
        </div>
      )}
    </div>
  );
};
