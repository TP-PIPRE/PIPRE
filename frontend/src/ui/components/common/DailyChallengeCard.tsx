import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { gameProgressService } from "../../../infrastructure/api/gameProgressService";
import type { DailyChallengeDTO } from "../../../infrastructure/api/models/gameProgressModels";
import { getAuthState } from "../../../infrastructure/store/authStore";
import { useAchievementStore } from "../../../infrastructure/store/achievementStore";
import { useDailySet } from "./useDailySet";
import { DailyProgress } from "./DailyProgress";

export function DailyChallengeCard() {
  const user = getAuthState().user;
  const studentId = user?.role === "student" ? user.id : "";
  const { daily: set } = useDailySet(studentId);
  const count = set?.challenges.filter(c => c.completedAt).length ?? 0;
  const revision = useAchievementStore(state => state.revisions[studentId] ?? 0);
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState<{ studentId?:string; daily?: DailyChallengeDTO; error?: boolean }>({});
  useEffect(() => {
    if (!studentId) return;
    let active = true;
    const controller = new AbortController();
    const refresh = () => setRetry(value => value + 1);
    const timer = setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    gameProgressService.daily(studentId, controller.signal).then(daily => { if (active) setState({ studentId, daily }); }).catch(() => { if (active) setState({ studentId, error: true }); });
    return () => { active = false; controller.abort(); clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [studentId, revision, retry]);
  if (!studentId) return null;
  const daily=state.studentId===studentId?state.daily:undefined;
  const error=state.studentId===studentId&&state.error;
  return <section className="mb-8 rounded-xl border border-border bg-surface p-5 sm:p-6" aria-labelledby="daily-challenge-title">
    <div className="flex flex-wrap items-center gap-4"><div className="min-w-0 flex-1"><h2 id="daily-challenge-title" className="flex items-center gap-2 text-lg font-semibold"><CalendarDays size={20} aria-hidden="true" />Reto diario</h2>{daily ? <><p className="mt-2 text-sm text-text-muted">Cinco tableros de Neon Flow y TetriLogic · <time dateTime={daily.date}>{daily.date}</time> (Lima)</p><p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm"><span className="inline-flex items-center gap-1.5"><Flame size={16} aria-hidden="true" />Racha: {daily.currentStreak} {daily.currentStreak === 1 ? "día" : "días"}</span><span className="text-text-muted">Mejor: {daily.bestStreak} {daily.bestStreak === 1 ? "día" : "días"}</span>{(count === 5) && <span className="inline-flex items-center gap-1.5 font-semibold text-success"><CheckCircle2 size={16} aria-hidden="true" />Completado hoy</span>}</p></> : error ? <p role="alert" className="mt-2 text-sm text-text-muted">No pudimos consultar el reto de hoy.</p> : <p role="status" className="mt-2 text-sm text-text-muted">Consultando el reto de hoy…</p>}</div>{daily ? <Link to="/simulador?daily=true" className="btn-premium">{(count === 5) ? "Ver reto completado" : count > 0 ? "Continuar reto diario" : "Iniciar reto diario"}</Link> : error ? <button className="btn-secondary" onClick={() => { setState({}); setRetry(value => value + 1); }}>Reintentar</button> : null}</div>
    {set && <DailyProgress daily={set} />}
  </section>;
}
