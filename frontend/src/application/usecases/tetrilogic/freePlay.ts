import type { BoardSize, Cell, LevelConfig, Piece, RotationAngle } from "../../../shared/types/TetriLogic";
import { cellsOf, createInventory, rotate, shapeAt } from "./rules";

export const isPlaced = (piece: Piece) => piece.position.x >= 0 && piece.position.y >= 0;

/** Free exploration only enforces the grid bounds and collisions, never challenge conditions. */
export function canPlaceFreely(size: BoardSize, pieces: Piece[], candidate: Piece) {
  if (!Number.isInteger(candidate.position.x) || !Number.isInteger(candidate.position.y)) return false;
  const occupied = new Set(pieces.filter(p => p.id !== candidate.id && isPlaced(p))
    .flatMap(cellsOf).map(c => `${c.x},${c.y}`));
  return cellsOf(candidate).every(c => c.x >= 0 && c.y >= 0 && c.x < size.cols && c.y < size.rows && !occupied.has(`${c.x},${c.y}`));
}

/** Rotate the grabbed cell with the shape, keeping that cell underneath the pointer. */
export function rotateGrip(piece: Piece, grip: Cell): Cell {
  if (piece.type === "O") return { ...grip };
  return { x: Math.max(...piece.shape.map(c => c.y)) - grip.y, y: grip.x };
}

export function rotateFreely(piece: Piece, grip: Cell = { x: 0, y: 0 }): Piece {
  if (piece.type === "O") return { ...piece, rotation: ((piece.rotation + 90) % 360) as RotationAngle, shape: rotate(piece.shape), position: { ...piece.position } };
  const nextGrip = rotateGrip(piece, grip);
  return {
    ...piece, rotation: ((piece.rotation + 90) % 360) as RotationAngle, shape: rotate(piece.shape),
    position: isPlaced(piece) ? { x: piece.position.x + grip.x - nextGrip.x, y: piece.position.y + grip.y - nextGrip.y } : { x: -1, y: -1 },
  };
}

export interface FreePlayState {
  size: BoardSize;
  pieces: Piece[];
  initialPieces: Piece[];
  selectedId: string | null;
  message: string;
}

export type FreePlayAction =
  | { type: "select"; id: string | null }
  | { type: "place"; id: string; position: Cell; rotation?: RotationAngle }
  | { type: "rotate"; id: string; grip: Cell }
  | { type: "return"; id: string; rotation?: RotationAngle }
  | { type: "message"; message: string }
  | { type: "reset" };

export function createFreePlay(level: LevelConfig): FreePlayState {
  const pieces = createInventory(level);
  return { size: { ...level.boardSize }, pieces, initialPieces: pieces, selectedId: null, message: "" };
}

export function freePlayReducer(state: FreePlayState, action: FreePlayAction): FreePlayState {
  if (action.type === "reset") return { ...state, pieces: state.initialPieces, selectedId: null, message: "Tablero restablecido." };
  if (action.type === "message") return { ...state, message: action.message };
  if (action.type === "select") return action.id === null || state.pieces.some(p => p.id === action.id)
    ? { ...state, selectedId: action.id, message: action.id === null ? "Selección cancelada." : "" } : state;
  const piece = state.pieces.find(p => p.id === action.id);
  if (!piece) return state;
  if (action.type === "return") {
    const rotation = action.rotation ?? piece.rotation;
    return { ...state, pieces: state.pieces.map(p => p.id === piece.id
      ? { ...piece, rotation, shape: shapeAt(piece.type, rotation), position: { x: -1, y: -1 } } : p), selectedId: piece.id, message: "Pieza devuelta a la bandeja." };
  }
  const rotation = action.type === "place" ? action.rotation ?? piece.rotation : piece.rotation;
  const next = action.type === "rotate" ? rotateFreely(piece, action.grip)
    : { ...piece, rotation, shape: shapeAt(piece.type, rotation), position: action.position };
  if ((action.type === "place" || isPlaced(piece)) && !canPlaceFreely(state.size, state.pieces, next)) {
    return { ...state, message: action.type === "rotate" ? "No hay espacio para girar aquí." : "Ese espacio no está disponible." };
  }
  return { ...state, pieces: state.pieces.map(p => p.id === next.id ? next : p), selectedId: next.id,
    message: action.type === "rotate" ? "Pieza girada." : "Pieza colocada." };
}
