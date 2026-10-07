import { useEffect, useState } from "react";
import type { Cell, Grid, OpticalComponent, RotationAngle } from "../../../shared/types/NeonFlow";
import { NEONFLOW_LEVELS } from "../../../shared/constants/levelConfigs";
import { raycast } from "../../../application/usecases/neonflow/raycast";
import { useGameStore } from "../../../infrastructure/store/gameStore";
import { NeonBoard } from "./NeonBoard";
import { ComponentTray } from "./ComponentTray";
import { ControlPanel } from "../common/ControlPanel";
import { AiFeedbackToast } from "../common/AiFeedbackToast";

const LEVEL = NEONFLOW_LEVELS[0];
const HINT_MESSAGE = "IA: Revisa la rotación del espejo en la coordenada (1, 2).";

const createGrid = (): Grid => {
  const cells: Cell[] = Array.from({ length: LEVEL.width * LEVEL.height }, (_, i) => ({
    x: i % LEVEL.width,
    y: Math.floor(i / LEVEL.width),
    type: "EMPTY",
  }));

  for (const block of LEVEL.blocked) {
    cells[block.y * LEVEL.width + block.x].type = "BLOCK";
  }

  for (const receptor of LEVEL.receptors) {
    const cell = cells[receptor.position.y * LEVEL.width + receptor.position.x];
    cell.type = "RECEPTOR";
    cell.color = receptor.color;
  }

  return { width: LEVEL.width, height: LEVEL.height, cells };
};

export const NeonFlowStage: React.FC = () => {
  const [grid, setGrid] = useState<Grid>(createGrid);
  const [laserPath, setLaserPath] = useState<Cell[]>([]);
  const [hint, setHint] = useState<string | null>(null);

  const status = useGameStore((s) => s.status);
  const startGame = useGameStore((s) => s.startGame);
  const registerMove = useGameStore((s) => s.registerMove);
  const completeGame = useGameStore((s) => s.completeGame);

  useEffect(() => {
    startGame("neonflow");
  }, [startGame]);

  const updateCell = (target: Cell, patch: Partial<Cell>) => {
    setGrid((prev) => ({
      ...prev,
      cells: prev.cells.map((c) =>
        c.x === target.x && c.y === target.y ? { ...c, ...patch } : c,
      ),
    }));
  };

  const handleComponentDrop = (cell: Cell, component: OpticalComponent) => {
    if (component.type === "MIRROR_90") {
      updateCell(cell, { type: "MIRROR_90", rotation: 0 });
    } else {
      updateCell(cell, { type: "FILTER", color: component.color });
    }
    registerMove();
  };

  const handleRotateComponent = (cell: Cell) => {
    updateCell(cell, {
      rotation: (((cell.rotation ?? 0) + 90) % 360) as RotationAngle,
    });
    registerMove();
  };

  const handleCheck = () => {
    const path = raycast(
      grid,
      LEVEL.emitter.position,
      LEVEL.emitter.direction,
      LEVEL.emitter.color,
    );
    setLaserPath(path);

    const receptors = grid.cells.filter((c) => c.type === "RECEPTOR");
    const allLit =
      receptors.length > 0 &&
      receptors.every((r) => path.some((p) => p.x === r.x && p.y === r.y));

    if (allLit) {
      completeGame("SUCCESS");
    }
  };

  const handleLocalReset = () => {
    setGrid(createGrid());
    setLaserPath([]);
    setHint(null);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <NeonBoard
        grid={grid}
        laserPath={laserPath}
        laserColor={LEVEL.emitter.color ?? "white"}
        onComponentDrop={handleComponentDrop}
        onRotateComponent={handleRotateComponent}
      />
      <ComponentTray />
      <ControlPanel
        onCheck={handleCheck}
        onReset={handleLocalReset}
        onHint={() => setHint(HINT_MESSAGE)}
      />
      {status === "SUCCESS" && (
        <div className="rounded-lg bg-green-500/10 border border-green-500 px-4 py-2 text-sm font-bold text-green-500">
          ¡Receptor iluminado! Nivel completado.
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
