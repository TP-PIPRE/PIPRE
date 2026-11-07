import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getAuthState } from "../../../infrastructure/store/authStore";
import { useDailySet } from "./useDailySet";
import { DailyProgress } from "./DailyProgress";
import { NeonFlowStage } from "../NeonFlow/NeonFlowStage";
import { TetriLogicStage } from "../TetriLogic/TetriLogicStage";
import type { NeonFlowLevelConfig } from "../../../shared/types/NeonFlow";
import type { LevelConfig } from "../../../shared/types/TetriLogic";
import type { DailySetDTO } from "../../../infrastructure/api/models/gameProgressModels";

export function DailyChallengeStage() {
  const user = getAuthState().user;
  const studentId = user?.role === "student" ? user.id : "";
  const { daily, error, retry } = useDailySet(studentId);
  if (!studentId) return <main className="lab-shell"><h1>Reto diario</h1><p>Disponible para estudiantes.</p></main>;
  if (error || (daily && daily.challenges.length !== 5)) return <main className="lab-shell"><p role="alert">No pudimos cargar los ejercicios de hoy.</p><button className="btn-secondary" onClick={retry}>Reintentar</button></main>;
  if (!daily) return <p role="status" className="p-8">Cargando reto diario…</p>;
  return <DailyExerciseFlow key={`${studentId}:${daily.date}`} daily={daily} retry={retry} />;
}

function DailyExerciseFlow({ daily, retry }: { daily: DailySetDTO; retry: () => void }) {
  const [params, setParams] = useSearchParams();
  const pending = daily.challenges.find(c => !c.completedAt);
  const [activeId, setActiveId] = useState(() => {
    const requested = daily.challenges.find(c => c.id === params.get("challenge"));
    return requested && pending && requested.slot <= pending.slot ? requested.id : pending?.id;
  });
  const selected = daily.challenges.find(c => c.id === activeId) ?? pending;
  return <div><section className="lab-shell mb-4"><h1>Reto diario</h1><p><time>{daily.date}</time> · America/Lima</p><DailyProgress daily={daily} />
    {!pending ? <p role="status" className="font-semibold text-success">Reto diario completado: los cinco ejercicios fueron validados.</p> : selected?.completedAt ? <div><p role="status">Ejercicio validado. Tu progreso está guardado.</p><button className="btn-premium mt-3" onClick={() => { setActiveId(pending.id); setParams({ daily: "true", challenge: pending.id }); }}>Continuar con el siguiente ejercicio</button></div> : <h2 className="text-lg font-semibold">Ejercicio {selected?.slot} de 5 · {selected?.game === "neonflow" ? "Neon Flow" : "TetriLogic"}</h2>}
    {selected && !selected.completedAt && <p className="mt-2 text-sm text-text-muted">{selected.status === "IN_PROGRESS" ? "En progreso" : "Pendiente"}</p>}
  </section>
    {pending && selected && !selected.completedAt && (selected.config.templateId !== selected.levelTemplate || selected.config.level !== selected.levelNumber || selected.config.version !== 2
      ? <section className="lab-shell"><p role="alert">El tablero diario no es compatible.</p><button className="btn-secondary" onClick={retry}>Reintentar</button></section>
      : selected.game === "neonflow" ? <NeonFlowStage key={selected.id} levels={[selected.config as NeonFlowLevelConfig]} dailyChallengeId={selected.id} /> : <TetriLogicStage key={selected.id} levels={[selected.config as LevelConfig]} dailyChallengeId={selected.id} />)}
  </div>;
}
