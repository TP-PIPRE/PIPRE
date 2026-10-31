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
import type { ActivityResponseDTO } from "../../../infrastructure/api/models/apiModels";

import { createNeonGrid, neonSolved } from "../../../application/usecases/neonflow/board";
import { useAttemptTrace } from "../common/useAttemptTrace";
const createGrid=createNeonGrid;
const snapshot=(grid:Grid)=>grid.cells.filter(c=>c.type==='MIRROR_90'||c.type==='FILTER').map(c=>({type:c.type,x:c.x,y:c.y,...(c.rotation!==undefined?{rotation:c.rotation}:{}),...(c.color?{color:c.color}:{})}));

export const NeonFlowStage = ({ levels: LEVELS = NEONFLOW_LEVELS, activity }: { levels?: NeonFlowLevelConfig[]; activity?: ActivityResponseDTO }) => {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [grid, setGrid] = useState<Grid>(() => createGrid(LEVELS[0]));
  const [laserPath, setLaserPath] = useState<Cell[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [staticHints,setStaticHints]=useState(0);

  const [selectedComponent, setSelectedComponent] = useState<OpticalComponent | null>(null);
  const level = LEVELS[currentLevelIndex];
  const templateId=activity?.levelTemplate??level.templateId;
  const {record,finish}=useAttemptTrace(templateId?{game:"neonflow",activityId:activity?.idActivity,levelTemplate:templateId,templateVersion:level.version??1,ruleset:"neonflow-raycast-v1"}:null);

  const status = useGameStore((s) => s.status);
  const startGame = useGameStore((s) => s.startGame);
  const registerMove = useGameStore((s) => s.registerMove);
  const completeGame = useGameStore((s) => s.completeGame);

  useEffect(() => {
    startGame("neonflow", {telemetry:false});
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
    setStaticHints(0);
    setCurrentLevelIndex(index);
    resetForLevel(index);
    startGame("neonflow", {telemetry:false});
  };

  const handleNextLevel = () => {
    setStaticHints(0);
    const next = currentLevelIndex + 1;
    if (next >= LEVELS.length) return;
    setCurrentLevelIndex(next);
    resetForLevel(next);
    startGame("neonflow", {telemetry:false});
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
    if(cell.x===level.emitter.position.x&&cell.y===level.emitter.position.y){record('REJECT',{errorCode:'EMITTER_RESERVED'});return;}
    if(status!=='PLAYING')startGame('neonflow',{telemetry:false});
    const patch=component.type==='MIRROR_90'?{type:'MIRROR_90' as const,rotation:0 as const}:{type:'FILTER' as const,color:component.color};
    const next={...grid,cells:grid.cells.map(c=>c.x===cell.x&&c.y===cell.y?{...c,...patch}:c)};
    record('PLACE',{x:cell.x,y:cell.y,component:component.type,...(component.color?{color:component.color}:{})},snapshot(grid),snapshot(next));
    setLaserPath([]);setFeedback('');
    if (component.type === "MIRROR_90") {
      updateCell(cell, { type: "MIRROR_90", rotation: 0 });
    } else {
      updateCell(cell, { type: "FILTER", color: component.color });
    }
    registerMove();
  };

  const handleRotateComponent = (cell: Cell) => {
    if(status!=='PLAYING')startGame('neonflow',{telemetry:false});
    const rotation=(((cell.rotation??0)+90)%360) as RotationAngle;
    const next={...grid,cells:grid.cells.map(c=>c.x===cell.x&&c.y===cell.y?{...c,rotation}:c)};
    record('ROTATE',{x:cell.x,y:cell.y,rotation},snapshot(grid),snapshot(next));setLaserPath([]);setFeedback('');
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

    const allLit=neonSolved(grid,path,level.emitter.color);
    record('CHECK',{matched:allLit,...(!allLit?{errorCode:'UNLIT_RECEPTOR'}:{})});
    setFeedback(allLit ? "¡Todos los receptores están iluminados!" : "El haz aún no llega a todos los receptores. Revisa los espejos y vuelve a comprobar.");
    if (allLit) {
      completeGame("SUCCESS");
      finish("SUCCESS");
    }
  };

  return (
    <main className="lab-shell neon-flow-stage">
      <header className="lab-heading"><div><Link to="/" className="text-sm font-semibold text-primary">← Mis cursos</Link><h1>{activity?.name ?? "Neon Flow"}</h1><p className="page-intro">{activity?.description || "Guía el haz de luz hasta los receptores usando espejos y filtros."}</p></div><span className="text-sm text-text-muted">{activity ? "Neon Flow" : `Nivel ${currentLevelIndex + 1} de ${LEVELS.length}`}</span></header>
      {activity?.missions?.length ? <section aria-label="Misiones del reto" className="mb-4 rounded-lg border border-border bg-surface p-4"><h2 className="mb-2 text-lg font-semibold">Misiones</h2><ul className="space-y-2 text-sm">{activity.missions.map(m => <li key={m.id}><strong>{m.title}</strong><p className="text-text-muted">{m.objective}</p></li>)}</ul></section> : null}
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
      <ComponentTray selected={selectedComponent} onSelect={component=>{setSelectedComponent(component);record("SELECT",{component:component.type,...(component.color?{color:component.color}:{})});}} />
      <p role="status" className="lab-status">{feedback || "Prepara el tablero y pulsa Comprobar para validar tu solución."}</p>
      <ControlPanel
        onCheck={handleCheck}
        onReset={() => {record("RESET",{},snapshot(grid),[]);resetForLevel(currentLevelIndex);}}
        hintKind="static" hintCount={staticHints}
        onHint={() => {record("HELP",{source:"STATIC"});setStaticHints(n=>n+1);setHint("Pista: sigue la dirección del haz y comprueba cada giro. Los filtros sólo dejan pasar su mismo color.");}}
      />
      {status === "SUCCESS" &&
        (currentLevelIndex === LEVELS.length - 1 ? (
          <div className="flex flex-wrap items-center justify-center gap-3 rounded-lg bg-primary/10 border border-primary px-4 py-2">
            <span className="text-sm font-bold text-primary">
              {activity ? "¡Reto completado!" : "¡Curso Completado!"}
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
