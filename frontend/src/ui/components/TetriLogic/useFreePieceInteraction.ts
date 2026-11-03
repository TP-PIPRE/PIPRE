import { useRef, useState } from "react";
import type { Dispatch, MouseEvent, PointerEvent } from "react";
import type { Cell, Piece } from "../../../shared/types/TetriLogic";
import { canPlaceFreely, isPlaced, rotateFreely, rotateGrip } from "../../../application/usecases/tetrilogic/freePlay";
import type { FreePlayAction, FreePlayState } from "../../../application/usecases/tetrilogic/freePlay";

interface Geometry { left: number; top: number; cell: number; right: number; bottom: number }
interface Point { x: number; y: number }
interface Pickup {
  id: number; target: HTMLButtonElement; start: Point; point: Point;
  piece: Piece; grip: Cell; active: boolean;
}
export interface FreePreview {
  piece: Piece; left: number; top: number; cell: number;
  position: Cell | null; valid: boolean; overTray: boolean; dragging: boolean;
}

export function useFreePieceInteraction(state: FreePlayState, dispatch: Dispatch<FreePlayAction>, observers: {onDraftRotate?:(id:string,rotation:number)=>void;onRejectedDrop?:(outside:boolean)=>void} = {}) {
  const boardRef = useRef<HTMLDivElement>(null);
  const trayRef = useRef<HTMLElement>(null);
  const pickup = useRef<Pickup | null>(null);
  const grip = useRef<Cell>({ x: 0, y: 0 });
  const selected = useRef<string | null>(null);
  const suppress = useRef<{ target: HTMLElement; until: number } | null>(null);
  const [preview, setPreview] = useState<FreePreview | null>(null);

  function geometry(): Geometry | null {
    const first = boardRef.current?.querySelector<HTMLButtonElement>('[data-cell-x="0"][data-cell-y="0"]')?.getBoundingClientRect();
    if (!first?.width) return null;
    return { left: first.left, top: first.top, cell: first.width,
      right: first.left + first.width * state.size.cols, bottom: first.top + first.height * state.size.rows };
  }
  function calculate(piece: Piece, offset: Cell, point: Point, dragging: boolean): FreePreview | null {
    const grid = geometry();
    if (!grid) return null;
    const inside = point.x >= grid.left && point.x < grid.right && point.y >= grid.top && point.y < grid.bottom;
    const position = inside ? { x: Math.floor((point.x - grid.left) / grid.cell) - offset.x,
      y: Math.floor((point.y - grid.top) / grid.cell) - offset.y } : null;
    const tray = trayRef.current?.getBoundingClientRect();
    const overTray = Boolean(tray && point.x >= tray.left && point.x <= tray.right && point.y >= tray.top && point.y <= tray.bottom);
    return { piece, position, dragging, overTray, cell: grid.cell,
      left: position ? grid.left + position.x * grid.cell : point.x - offset.x * grid.cell - grid.cell / 2,
      top: position ? grid.top + position.y * grid.cell : point.y - offset.y * grid.cell - grid.cell / 2,
      valid: Boolean(position && canPlaceFreely(state.size, state.pieces, { ...piece, position })) };
  }
  function choose(id: string | null, offset: Cell = { x: 0, y: 0 }) {
    selected.current = id; grip.current = offset;
    dispatch({ type: "select", id });
  }
  function ignoreClick(event: MouseEvent<HTMLButtonElement>) {
    if (event.detail > 0 && suppress.current?.target === event.currentTarget && performance.now() < suppress.current.until) {
      suppress.current = null; return true;
    }
    return false;
  }
  function begin(event: PointerEvent<HTMLButtonElement>, id: string, cell?: Cell) {
    if (event.button !== 0 || pickup.current) return;
    const piece = state.pieces.find(p => p.id === id);
    if (!piece) return;
    const hit = (event.target as HTMLElement).closest<HTMLElement>("[data-piece-x]");
    const offset = cell ? { x: cell.x - piece.position.x, y: cell.y - piece.position.y }
      : hit ? { x: Number(hit.dataset.pieceX), y: Number(hit.dataset.pieceY) } : { x: 0, y: 0 };
    choose(id, offset); setPreview(null);
    pickup.current = { id: event.pointerId, target: event.currentTarget, piece, grip: offset,
      start: { x: event.clientX, y: event.clientY }, point: { x: event.clientX, y: event.clientY }, active: false };
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }
  function releaseCapture(item: Pickup) {
    if (item.target.hasPointerCapture?.(item.id)) item.target.releasePointerCapture(item.id);
  }
  function cancel(message = "Movimiento cancelado.") {
    const item = pickup.current;
    pickup.current = null;
    if (item) {
      suppress.current = { target: item.target, until: performance.now() + 250 };
      releaseCapture(item);
    }
    setPreview(null);
    dispatch({ type: "message", message });
  }
  function move(event: PointerEvent<HTMLElement>) {
    const item = pickup.current;
    const point = { x: event.clientX, y: event.clientY };
    if (item) {
      if (event.pointerId !== item.id) return;
      item.point = point;
      if (!item.active && Math.hypot(point.x - item.start.x, point.y - item.start.y) < 5) return;
      item.active = true;
      event.preventDefault();
      setPreview(calculate(item.piece, item.grip, point, true));
    } else if (state.selectedId && event.pointerType !== "touch") {
      const piece = state.pieces.find(p => p.id === state.selectedId)!;
      const next = calculate(piece, grip.current, point, false);
      setPreview(next?.position ? next : null);
    }
  }
  function finish(event: PointerEvent<HTMLElement>) {
    const item = pickup.current;
    if (!item || event.pointerId !== item.id) return;
    pickup.current = null;
    releaseCapture(item);
    if (!item.active) { if (!isPlaced(item.piece)) grip.current = { x: 0, y: 0 }; return; }
    suppress.current = { target: item.target, until: performance.now() + 250 };
    const next = calculate(item.piece, item.grip, { x: event.clientX, y: event.clientY }, true);
    if (next?.valid && next.position) {
      grip.current = item.grip;
      dispatch({ type: "place", id: item.piece.id, position: next.position, rotation: item.piece.rotation });
    } else if (next?.overTray) {
      grip.current = { x: 0, y: 0 };
      dispatch({ type: "return", id: item.piece.id, rotation: item.piece.rotation });
    } else { observers.onRejectedDrop?.(!next?.position);dispatch({ type: "message", message: "Movimiento cancelado: elige un espacio libre o la bandeja." }); }
    setPreview(null);
  }
  function rotatePiece(id = state.selectedId ?? "", cell?: Cell) {
    const item = pickup.current;
    if (item) {
      item.active = true;
      const offset = rotateGrip(item.piece, item.grip);
      item.piece = rotateFreely(item.piece, item.grip); item.grip = offset;
      observers.onDraftRotate?.(item.piece.id,item.piece.rotation);
      setPreview(calculate(item.piece, offset, item.point, true));
      return;
    }
    const piece = state.pieces.find(p => p.id === id);
    if (!piece) return;
    const offset = cell ? { x: cell.x - piece.position.x, y: cell.y - piece.position.y }
      : selected.current === id ? grip.current : { x: 0, y: 0 };
    const next = rotateFreely(piece, offset);
    choose(id, offset);
    if (!isPlaced(piece)) grip.current = { x: 0, y: 0 };
    else if (canPlaceFreely(state.size, state.pieces, next)) grip.current = rotateGrip(piece, offset);
    dispatch({ type: "rotate", id, grip: offset });
    setPreview(null);
  }
  function activateCell(event: MouseEvent<HTMLButtonElement>, cell: Cell, id?: string) {
    if (ignoreClick(event)) return;
    if (id) {
      const piece = state.pieces.find(p => p.id === id)!;
      choose(id, { x: cell.x - piece.position.x, y: cell.y - piece.position.y });
    } else if (state.selectedId) dispatch({ type: "place", id: state.selectedId,
      position: { x: cell.x - grip.current.x, y: cell.y - grip.current.y } });
    setPreview(null);
  }
  function activateTray(event: MouseEvent<HTMLButtonElement>, id: string) {
    if (ignoreClick(event)) return;
    if (selected.current !== id) choose(id);
  }
  function returnPiece() {
    if (!state.selectedId) return;
    cancel("");
    grip.current = { x: 0, y: 0 };
    dispatch({ type: "return", id: state.selectedId });
  }
  function reset() {
    cancel(""); selected.current = null; grip.current = { x: 0, y: 0 };
    dispatch({ type: "reset" });
  }
  function keyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.ctrlKey || event.metaKey || event.altKey || (event.target as HTMLElement).closest("input, textarea, select")) return;
    const key = event.key.toLowerCase();
    if (key === "escape") { event.preventDefault(); cancel("Selección cancelada."); choose(null); }
    else if (key === "r" && !event.repeat && state.selectedId) { event.preventDefault(); rotatePiece(); }
    else if ((key === "delete" || key === "backspace") && state.selectedId) { event.preventDefault(); returnPiece(); }
    else if (!pickup.current && state.selectedId && ["arrowleft", "arrowright", "arrowup", "arrowdown"].includes(key)) {
      const piece = state.pieces.find(p => p.id === state.selectedId)!;
      if (!isPlaced(piece)) return;
      event.preventDefault();
      dispatch({ type: "place", id: piece.id, position: { x: piece.position.x + (key === "arrowleft" ? -1 : key === "arrowright" ? 1 : 0), y: piece.position.y + (key === "arrowup" ? -1 : key === "arrowdown" ? 1 : 0) } });
      setPreview(null);
    }
  }
  return { boardRef, trayRef, preview, begin, activateCell, activateTray, rotatePiece, returnPiece, reset,
    rootEvents: { onPointerMove: move, onPointerUp: finish,
      onPointerCancel: (event: PointerEvent<HTMLElement>) => { if (pickup.current?.id === event.pointerId) cancel(); },
      onLostPointerCapture: (event: PointerEvent<HTMLElement>) => { if (pickup.current?.id === event.pointerId) cancel(); },
      onPointerLeave: () => { if (!pickup.current) setPreview(null); },
      onContextMenuCapture: (event: React.MouseEvent<HTMLElement>) => {
        if (pickup.current?.active) { event.preventDefault(); event.stopPropagation(); rotatePiece(); }
      }, onKeyDown: keyDown } };
}
