import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { getAuthState } from "../../infrastructure/store/authStore";
import { apiService } from "../../infrastructure/api/apiService";
import { gameProgressService } from "../../infrastructure/api/gameProgressService";
import { useAchievementStore } from "../../infrastructure/store/achievementStore";
import type { PlayerProfileDTO, AchievementDTO, StudentHistoryDTO } from "../../infrastructure/api/models/apiModels";
import type { GameProgressDTO } from "../../infrastructure/api/models/gameProgressModels";
import { PlayerCard } from "../components/Perfil/PlayerCard";
import { StatsGrid } from "../components/Perfil/StatsGrid";
import { AchievementGrid } from "../components/Perfil/AchievementGrid";
import { HistoryTable } from "../components/Perfil/HistoryTable";
import { GameProgressOverview } from "../components/Perfil/GameProgressOverview";
import { DailyChallengeCard } from "../components/common/DailyChallengeCard";

type Tab = "stats" | "achievements" | "history";
const tabs: Array<{ id: Tab; label: string }> = [{ id: "stats", label: "Estadísticas" }, { id: "achievements", label: "Logros" }, { id: "history", label: "Historial" }];
interface ProfileData { studentId: string; profile: PlayerProfileDTO; achievements: AchievementDTO[]; history: StudentHistoryDTO[]; progress: GameProgressDTO; }

export const PerfilPage = () => {
  const studentId = getAuthState().user?.id ?? "";
  const [search, setSearch] = useSearchParams();
  const requestedTab = search.get("tab");
  const activeTab = tabs.find(tab => tab.id === requestedTab)?.id ?? "stats";
  const revision = useAchievementStore(state => state.revisions[studentId] ?? 0);
  const [retry, setRetry] = useState(0);
  const [data, setData] = useState<ProfileData | null>(null);
  const [errorStudentId, setErrorStudentId] = useState<string|null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!studentId) return;
    let active = true;
    Promise.all([apiService.profile.get(studentId), apiService.profile.getAchievements(studentId), apiService.profile.getHistory(studentId), gameProgressService.progress(studentId)])
      .then(([profile, achievements, history, progress]) => {
        if (active) { setData({ studentId, profile, achievements, history, progress }); setErrorStudentId(null); }
      }).catch(() => { if (active) setErrorStudentId(studentId); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [studentId, retry, revision]);
  const refresh = () => { setLoading(true); setRetry(value => value + 1); };
  const current = data?.studentId === studentId ? data : null;
  const error=errorStudentId===studentId;
  const waiting=loading||Boolean(studentId&&!current&&!error);
  return <main className="mx-auto w-full max-w-6xl flex-1 px-2 py-2 sm:px-4 sm:py-4">
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p className="page-eyebrow mb-2">Tu laboratorio</p><h1>Mi perfil</h1></div><button className="btn-secondary" onClick={refresh} disabled={waiting}><RefreshCw size={18} aria-hidden="true" className={waiting ? "animate-spin" : ""} />Actualizar</button></header>
    {studentId && waiting && !current ? <p role="status" className="py-12 text-center text-text-muted">Cargando tu perfil…</p> : !studentId || (!current && error) ? <div className="rounded-xl border border-border bg-surface p-6"><p role="alert" className="mb-4">No pudimos cargar tu perfil. Comprueba tu conexión y vuelve a intentarlo.</p><button className="btn-secondary" onClick={refresh}>Reintentar</button></div> : current ? <>
      {error && <p role="alert" className="mb-4 rounded-lg border border-danger p-4 text-sm">No pudimos actualizar el perfil. Se muestran los últimos datos recibidos del servidor.</p>}
      <PlayerCard profile={current.profile} />
      <nav aria-label="Secciones del perfil" className="my-6 flex flex-wrap gap-2 border-b border-border">{tabs.map(tab => <button key={tab.id} aria-current={activeTab === tab.id ? "page" : undefined} onClick={() => setSearch({ tab: tab.id })} className={`min-h-11 border-b-2 px-4 text-sm font-semibold ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text"}`}>{tab.label}</button>)}</nav>
      {activeTab === "stats" && <div className="space-y-6"><StatsGrid profile={current.profile} /><GameProgressOverview progress={current.progress} /><DailyChallengeCard /></div>}
      {activeTab === "achievements" && <AchievementGrid achievements={current.achievements} />}
      {activeTab === "history" && <HistoryTable history={current.history} />}
    </> : null}
  </main>;
};
export default PerfilPage;
