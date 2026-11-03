import type { Board, Cell, LevelConfig, Piece, RotationAngle, TetriminoType } from "../../../shared/types/TetriLogic";
import { validatePlacement } from "./validatePlacement";

export const SHAPES: Record<TetriminoType, Cell[]> = {
  O: [{x:0,y:0},{x:1,y:0},{x:0,y:1},{x:1,y:1}],
  I: [{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:3,y:0}],
  T: [{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:1,y:1}],
  S: [{x:1,y:0},{x:2,y:0},{x:0,y:1},{x:1,y:1}],
  Z: [{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:2,y:1}],
  L: [{x:0,y:0},{x:0,y:1},{x:0,y:2},{x:1,y:2}],
  J: [{x:1,y:0},{x:1,y:1},{x:0,y:2},{x:1,y:2}],
};
const key = (c: Cell) => `${c.x},${c.y}`;
export function rotate(shape: Cell[]): Cell[] {
  const rotated = shape.map(({x,y}) => ({x:-y,y:x}));
  const minX = Math.min(...rotated.map(c => c.x)), minY = Math.min(...rotated.map(c => c.y));
  return rotated.map(c => ({x:c.x-minX,y:c.y-minY}));
}
export function shapeAt(type: TetriminoType, rotation: number): Cell[] {
  let shape = SHAPES[type];
  for (let r = 0; r < rotation; r += 90) shape = rotate(shape);
  return shape;
}
export function createInventory(level: LevelConfig): Piece[] {
  const inventory = level.inventory ?? [
    {id:"o1",type:"O"},{id:"i1",type:"I"},{id:"t1",type:"T"},{id:"s1",type:"S"},{id:"o2",type:"O"},{id:"i2",type:"I"},
  ];
  return inventory.map(p => ({...p, type:p.type as TetriminoType, rotation:0 as RotationAngle, position:{x:-1,y:-1}, shape:SHAPES[p.type as TetriminoType].map(c => ({...c}))}));
}
export function createBoard(level: LevelConfig, pieces: Piece[] = []): Board {
  const occupied = new Map(pieces.flatMap(p => cellsOf(p).map(c => [key(c),p.type] as const)));
  return {size:level.boardSize, blockedCells:level.blockedCells, cells:Array.from({length:level.boardSize.rows},(_,y) =>
    Array.from({length:level.boardSize.cols},(_,x) => ({position:{x,y},blocked:level.blockedCells.some(c => c.x===x && c.y===y),tetriminoType:occupied.get(`${x},${y}`) ?? null})))};
}
export function cellsOf(piece: Piece): Cell[] {
  return piece.shape.map(c => ({x:c.x+piece.position.x,y:c.y+piece.position.y}));
}
export function counts(level: Pick<LevelConfig, "boardSize">, pieces: Piece[]) {
  const rows = Array<number>(level.boardSize.rows).fill(0), cols = Array<number>(level.boardSize.cols).fill(0);
  pieces.flatMap(cellsOf).forEach(c => { if (rows[c.y] !== undefined) rows[c.y]++; if (cols[c.x] !== undefined) cols[c.x]++; });
  return {rows,cols};
}
export function placementError(level: LevelConfig, pieces: Piece[], piece: Piece): string | null {
  if (!validatePlacement(createBoard(level,pieces.filter(p => p.id!==piece.id)),piece,piece.position)) return "La pieza no cabe aquí. Elige otra celda libre.";
  // Precedence applies to first placement. Repositioning never erases an earlier legal placement.
  if (!pieces.some(p => p.id===piece.id)) {
    const missing = level.precedences?.find(e => e.after===piece.id && !pieces.some(p => p.id===e.before));
    if (missing) return `Coloca ${missing.before.toUpperCase()} antes de ${piece.id.toUpperCase()}.`;
  }
  return null;
}
export function solutionError(level: LevelConfig, pieces: Piece[]): string | null {
  if (new Set(pieces.map(p => p.id)).size!==pieces.length) return "Hay piezas duplicadas.";
  if (level.inventory && (pieces.length!==level.inventory.length || level.inventory.some(p => !pieces.some(q => q.id===p.id && q.type===p.type)))) return "Coloca todas las piezas del inventario antes de comprobar.";
  for (const p of pieces) if (placementError({...level,precedences:[]},pieces,p)) return "Revisa las piezas: no pueden salir del tablero, superponerse ni ocupar bloqueos.";
  const serialize = (shape: Cell[]) => shape.map(key).sort().join(";");
  if (pieces.some(p=>serialize(p.shape)!==serialize(shapeAt(p.type,p.rotation)))) return "La forma de una pieza no corresponde a su orientación.";
  const {rows,cols} = counts(level,pieces);
  if (!level.constraints.every(c => (c.orientation==="row" ? rows[c.line] : cols[c.line])===c.targetCount)) return "Revisa los objetivos de filas y columnas antes de volver a comprobar.";
  const occupied = new Set(pieces.flatMap(cellsOf).map(key));
  if (level.requiredCells?.some(c => !occupied.has(key(c)))) return "Cubre también todas las celdas marcadas con un punto.";
  for (const rule of level.orientations ?? []) {
    if (!rule.allowed.includes(pieces.find(p => p.id===rule.pieceId)?.rotation ?? -1)) return `Revisa la orientación de ${rule.pieceId.toUpperCase()}.`;
  }
  for (const pair of level.contacts ?? []) {
    const a = pieces.find(p => p.id===pair.first), b = pieces.find(p => p.id===pair.second);
    if (!a || !b || !cellsOf(a).some(c => cellsOf(b).some(d => Math.abs(c.x-d.x)+Math.abs(c.y-d.y)===1))) return `${pair.first.toUpperCase()} y ${pair.second.toUpperCase()} deben compartir un lado.`;
  }
  return null;
}

/** Validate server content against the reviewed immutable template, ignoring JSON key order. */
export function sameConfig(expected: unknown, actual: unknown): boolean {
  if (expected === actual) return true;
  if (!expected || !actual || typeof expected!=="object" || typeof actual!=="object") return false;
  if (Array.isArray(expected)) return Array.isArray(actual) && expected.length===actual.length && expected.every((e,i)=>sameConfig(e,actual[i]));
  if (Array.isArray(actual)) return false;
  const a = expected as Record<string,unknown>, b = actual as Record<string,unknown>;
  return Object.keys(a).length===Object.keys(b).length && Object.keys(a).every(k=>sameConfig(a[k],b[k]));
}
