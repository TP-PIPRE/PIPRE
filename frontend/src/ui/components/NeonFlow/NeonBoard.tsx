import type { Cell, CellType, Grid, OpticalComponent } from "../../../shared/types/NeonFlow";
import { NEON_DND_TYPE } from "../../../shared/constants/neonFlow";

export interface NeonBoardProps {
  grid: Grid;
  laserPath: Cell[];
  laserColor: string;
  onComponentDrop: (cell: Cell, component: OpticalComponent) => void;
  onRotateComponent: (cell: Cell) => void;
}

interface CellHandlers {
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, cell: Cell) => void;
  onRotate: (cell: Cell) => void;
}

const isInPath = (laserPath: Cell[], cell: Cell): boolean =>
  laserPath.some((c) => c.x === cell.x && c.y === cell.y);

const renderCell = (cell: Cell, laserPath: Cell[], handlers: CellHandlers): React.ReactNode => {
  switch (cell.type as CellType) {
    case "EMPTY":
      return (
        <div
          key={`${cell.x},${cell.y}`}
          onDragOver={handlers.onDragOver}
          onDrop={(e) => handlers.onDrop(e, cell)}
          className="rounded-sm bg-surface-brighter border border-border"
        />
      );
    case "BLOCK":
      return (
        <div
          key={`${cell.x},${cell.y}`}
          className="rounded-sm bg-gray-700/90 shadow-inner border border-gray-600"
        />
      );
    case "MIRROR_90":
      return (
        <div
          key={`${cell.x},${cell.y}`}
          onContextMenu={(e) => {
            e.preventDefault();
            handlers.onRotate(cell);
          }}
          className="flex cursor-pointer items-center justify-center rounded-sm bg-surface-brighter border border-border"
          style={{ transform: `rotate(${cell.rotation ?? 0}deg)` }}
          title="Click derecho para rotar">
          <div className="h-[2px] w-[70%] rounded-full bg-cyan-300" />
        </div>
      );
    case "FILTER":
      return (
        <div
          key={`${cell.x},${cell.y}`}
          className="flex items-center justify-center rounded-sm bg-surface-brighter border border-border">
          <div
            className="flex h-3/4 w-3/4 items-center justify-center rounded-full border-2"
            style={{ borderColor: cell.color ?? "transparent" }}>
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: cell.color ?? "transparent" }}
            />
          </div>
        </div>
      );
    case "RECEPTOR": {
      const lit = isInPath(laserPath, cell);
      return (
        <div
          key={`${cell.x},${cell.y}`}
          className="flex items-center justify-center rounded-sm bg-surface-brighter border border-border">
          <div
            className={`flex h-3/4 w-3/4 items-center justify-center rounded-full border-2 ${
              lit ? "shadow-[0_0_12px_4px_var(--theme-primary-glow)]" : ""
            }`}
            style={{ borderColor: cell.color ?? "transparent" }}>
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: cell.color ?? "transparent" }}
            />
          </div>
        </div>
      );
    }
    default:
      return null;
  }
};

export const NeonBoard: React.FC<NeonBoardProps> = ({
  grid,
  laserPath,
  laserColor,
  onComponentDrop,
  onRotateComponent,
}) => {
  const points = laserPath
    .map((c) => `${c.x + 0.5},${c.y + 0.5}`)
    .join(" ");

  const handlers: CellHandlers = {
    onDragOver: (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    },
    onDrop: (e, cell) => {
      e.preventDefault();
      if (cell.type !== "EMPTY") return;
      const raw = e.dataTransfer.getData(NEON_DND_TYPE);
      if (!raw) return;
      try {
        const component = JSON.parse(raw) as OpticalComponent;
        if (component.type === "MIRROR_90" || component.type === "FILTER") {
          onComponentDrop(cell, component);
        }
      } catch {
        /* ignore malformed payload */
      }
    },
    onRotate: onRotateComponent,
  };

  return (
    <div className="relative">
      <div
        className="grid gap-1 rounded-xl border border-border bg-surface p-1 shadow-lg"
        style={{
          gridTemplateRows: `repeat(${grid.height}, 1fr)`,
          gridTemplateColumns: `repeat(${grid.width}, 1fr)`,
          aspectRatio: `${grid.width} / ${grid.height}`,
        }}>
        {grid.cells.map((cell) => renderCell(cell, laserPath, handlers))}
      </div>

      {laserPath.length > 1 && (
        <svg
          className="pointer-events-none absolute inset-0"
          viewBox={`0 0 ${grid.width} ${grid.height}`}
          preserveAspectRatio="none">
          <polyline
            points={points}
            fill="none"
            stroke={laserColor}
            strokeWidth={0.14}
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${laserColor})` }}
          />
        </svg>
      )}
    </div>
  );
};
