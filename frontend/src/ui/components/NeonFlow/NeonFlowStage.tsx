import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Cell, Grid, NeonFlowLevelConfig, OpticalComponent, RotationAngle } from "../../../shared/types/NeonFlow";
import { NEONFLOW_LEVELS } from "../../../shared/constants/levelConfigs";
import { raycast } from "../../../application/usecases/neonflow/raycast";
import { useGameStore } from "../../../infrastructure/store/gameStore";
import { NeonBoard } from "./NeonBoard";
import { ComponentTray } from "./ComponentTray";
import { ControlPanel } from "../common/ControlPanel";
import { AiFeedbackToast } from "../common/AiFeedbackToast";

const LEVELS = NEONFLOW_LEVELS;
const HINT_MESSAGE = "IA: Revisa la rotación del espejo en la coordenada (1, 2).";

const createGrid = (level: NeonFlowLevelConfig): Grid => {
  const cells: Cell[] = Array.from({ length: level.width * level.height }, (_, i) => ({
    x: i % level.width,
    y: Math.floor(i / level.width),
    type: "EMPTY",
  }));

  for (const block of level.blocked) {
    cells[block.y * level.width + block.x].type = "BLOCK";
  }

  for (const receptor of level.receptors) {
    const cell = cells[receptor.position.y * level.width + receptor.position.x];
    cell.type = "RECEPTOR";
    cell.color = receptor.color;
  }

  return { width: level.width, height: level.height, cells };
};

export const NeonFlowStage: React.FC = () => {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [grid, setGrid] = useState<Grid>(() => createGrid(LEVELS[0]));
  const [laserPath, setLaserPath] = useState<Cell[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  const [selectedComponent, setSelectedComponent] = useState<OpticalComponent | null>(null);
  const level = LEVELS[currentLevelIndex];

  const status = useGameStore((s) => s.status);
  const startGame = useGameStore((s) => s.startGame);
  const registerMove = useGameStore((s) => s.registerMove);
  const completeGame = useGameStore((s) => s.completeGame);

  useEffect(() => {
    startGame("neonflow");
    return () => {
      useGameStore.getState().stopGame();
    };
  }, [startGame]);

  const resetForLevel = (index: number) => {
    setGrid(createGrid(LEVELS[index]));
    setLaserPath([]);
    setHint(null);
    setFeedback("");
    setSelectedComponent(null);
  };

  const handleLevelChange = (index: number) => {
    setCurrentLevelIndex(index);
    resetForLevel(index);
    startGame("neonflow");
  };

  const handleNextLevel = () => {
    const next = currentLevelIndex + 1;
    if (next >= LEVELS.length) return;
    setCurrentLevelIndex(next);
    resetForLevel(next);
    startGame("neonflow");
  };

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
      level.emitter.position,
      level.emitter.direction,
      level.emitter.color,
    );
    setLaserPath(path);

    const receptors = grid.cells.filter((c) => c.type === "RECEPTOR");
    const allLit =
      receptors.length > 0 &&
      receptors.every((r) => path.some((p) => p.x === r.x && p.y === r.y));

    setFeedback(allLit ? "¡Todos los receptores están iluminados!" : "El haz aún no llega a todos los receptores. Revisa los espejos y vuelve a comprobar.");
    if (allLit) {
      completeGame("SUCCESS");
    }
  };

  return (
    <main className="lab-shell">
      <header className="lab-heading"><div><Link to="/" className="text-sm font-semibold text-primary">← Mis cursos</Link><h1>Neon Flow</h1><p className="page-intro">Guía el haz de luz hasta los receptores usando espejos y filtros.</p></div><span className="text-sm text-text-muted">Nivel {level.level} de {LEVELS.length}</span></header>
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

      <NeonBoard
        grid={grid}
        laserPath={laserPath}
        laserColor={level.emitter.color ?? "white"}
        onComponentDrop={handleComponentDrop}
        onRotateComponent={handleRotateComponent}
        selectedComponent={selectedComponent}
        emitter={level.emitter.position}
      />
      <p className="text-sm text-text-muted text-center">Selecciona un componente y una celda vacía. Pulsa un espejo para rotarlo; también puedes arrastrar.</p>
      <ComponentTray selected={selectedComponent} onSelect={setSelectedComponent} />
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
              ¡Receptor iluminado! Nivel completado.
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
