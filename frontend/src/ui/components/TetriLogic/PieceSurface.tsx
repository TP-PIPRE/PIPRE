import type { Cell, Piece } from "../../../shared/types/TetriLogic";

/** Follow the outside of a polyomino, then round its convex and concave corners. */
function silhouette(shape: Cell[]) {
  const cells = new Set(shape.map(c => `${c.x},${c.y}`));
  const edges = new Map<string, Cell>();
  for (const { x, y } of shape) {
    if (!cells.has(`${x},${y - 1}`)) edges.set(`${x},${y}`, { x: x + 1, y });
    if (!cells.has(`${x + 1},${y}`)) edges.set(`${x + 1},${y}`, { x: x + 1, y: y + 1 });
    if (!cells.has(`${x},${y + 1}`)) edges.set(`${x + 1},${y + 1}`, { x, y: y + 1 });
    if (!cells.has(`${x - 1},${y}`)) edges.set(`${x},${y + 1}`, { x, y });
  }
  const start = [...edges.keys()][0];
  if (!start) return "";
  const vertices: Cell[] = [];
  let key = start;
  do {
    const [x, y] = key.split(",").map(Number);
    vertices.push({ x, y });
    const next = edges.get(key);
    if (!next) return "";
    key = `${next.x},${next.y}`;
  } while (key !== start && vertices.length <= edges.size);
  const corners = vertices.filter((v, i) => {
    const a = vertices[(i + vertices.length - 1) % vertices.length], b = vertices[(i + 1) % vertices.length];
    return (v.x - a.x) * (b.y - v.y) !== (v.y - a.y) * (b.x - v.x);
  });
  const rounded = corners.map((v, i) => {
    const a = corners[(i + corners.length - 1) % corners.length], b = corners[(i + 1) % corners.length];
    return { v, enter: { x: v.x + Math.sign(a.x - v.x) * .10, y: v.y + Math.sign(a.y - v.y) * .10 },
      exit: { x: v.x + Math.sign(b.x - v.x) * .10, y: v.y + Math.sign(b.y - v.y) * .10 } };
  });
  return rounded.map(({ v, enter, exit }, i) => `${i ? "L" : "M"}${enter.x},${enter.y} Q${v.x},${v.y} ${exit.x},${exit.y}`).join(" ") + " Z";
}

export function PieceSurface({ piece, selected = false, x = 0, y = 0 }: {
  piece: Pick<Piece, "type" | "shape">; selected?: boolean; x?: number; y?: number;
}) {
  return <g className="tetri-piece-surface" data-piece-type={piece.type} data-selected={selected} transform={`translate(${x} ${y})`}>
    <path className="tetri-piece-body" d={silhouette(piece.shape)} vectorEffect="non-scaling-stroke" />
    {piece.shape.map(c => <rect key={`${c.x},${c.y}`} className="tetri-piece-tile" x={c.x + .055} y={c.y + .055} width=".89" height=".89" rx=".065" />)}
  </g>;
}

export function PieceGhost({ piece, cellSize }: { piece: Piece; cellSize: number }) {
  const cols = Math.max(...piece.shape.map(c => c.x)) + 1, rows = Math.max(...piece.shape.map(c => c.y)) + 1;
  return <svg className="tetri-piece-ghost" width={cols * cellSize} height={rows * cellSize} viewBox={`0 0 ${cols} ${rows}`} aria-hidden="true"><PieceSurface piece={piece} selected /></svg>;
}
