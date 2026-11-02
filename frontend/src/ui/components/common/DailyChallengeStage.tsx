import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { gameProgressService } from "../../../infrastructure/api/gameProgressService";
import { getAuthState } from "../../../infrastructure/store/authStore";
import type { DailyChallengeDTO } from "../../../infrastructure/api/models/gameProgressModels";
import { LEVEL_TEMPLATES } from "../../../application/usecases/activityLevels";
import { PersistedNeonFlowStage } from "../NeonFlow/PersistedNeonFlowStage";
import { PersistedTetriLogicStage } from "../TetriLogic/PersistedTetriLogicStage";

export function DailyChallengeStage() {
  const user = getAuthState().user;
  const studentId = user?.role === "student" ? user.id : "";
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState<{ studentId?:string; daily?: DailyChallengeDTO; error?: boolean }>({});
  useEffect(() => {
    if (!studentId) return;
    let active = true;
    const controller = new AbortController();
    gameProgressService.daily(studentId, controller.signal).then(daily => { if (active) setState({ studentId, daily }); }).catch(() => { if (active) setState({ studentId, error: true }); });
    return () => { active = false; controller.abort(); };
  }, [studentId, retry]);
  if (!studentId) return <main className="lab-shell"><h1>Reto diario</h1><p className="my-4">El reto diario está disponible para estudiantes.</p><Link to="/" className="btn-secondary">Ver mis cursos</Link></main>;
  const daily = state.studentId===studentId?state.daily:undefined;
  const template = daily && LEVEL_TEMPLATES.find(item => item.id === daily.levelTemplate && item.game === daily.game && item.config.version === 2 && item.config.level === daily.levelNumber);
  if ((state.studentId===studentId&&state.error) || (daily && !template)) return <main className="lab-shell"><h1>Reto diario</h1><p role="alert" className="my-4">No pudimos cargar el reto de hoy. Reintenta para consultar su tablero.</p><button className="btn-secondary" onClick={() => { setState({}); setRetry(value => value + 1); }}>Reintentar</button></main>;
  if (!daily || !template) return <p role="status" className="p-8 text-center">Cargando reto diario…</p>;
  return <div><div className="mx-auto mb-2 max-w-[1120px] px-4 text-sm text-text-muted">Reto diario · <time dateTime={daily.date}>{daily.date}</time> · America/Lima{daily.completed ? " · Completado hoy" : ""}</div>{template.game === "neonflow" ? <PersistedNeonFlowStage key={daily.id} config={template.config} dailyChallengeId={daily.id} /> : <PersistedTetriLogicStage key={daily.id} config={template.config} dailyChallengeId={daily.id} />}</div>;
}
