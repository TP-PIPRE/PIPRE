import type { Cell, Direction, Grid } from "../../../shared/types/NeonFlow";

export function raycast(
  grid: Grid,
  origin: Cell,
  direction: Direction,
  laserColor?: string,
): Cell[] {
  const path: Cell[] = [];
  const maxSteps = grid.width * grid.height * 4;

  let x = origin.x;
  let y = origin.y;
  let dx = direction.dx;
  let dy = direction.dy;

  for (let step = 0; step < maxSteps; step++) {
    if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) {
      break;
    }

    const cell = grid.cells[y * grid.width + x];
    if (!cell) {
      break;
    }

    path.push(cell);

    switch (cell.type) {
      case "EMPTY":
        break;
      case "BLOCK":
        return path;
      case "MIRROR_90": {
        const isSlash = (cell.rotation ?? 0) % 180 === 0;
        const ndx = isSlash ? -dy : dy;
        const ndy = isSlash ? -dx : dx;
        dx = ndx as -1 | 0 | 1;
        dy = ndy as -1 | 0 | 1;
        break;
      }
      case "FILTER":
        if (cell.color !== laserColor) {
          return path;
        }
        break;
      case "RECEPTOR":
        return path;
      default:
        return path;
    }

    x += dx;
    y += dy;
  }

  return path;
}
