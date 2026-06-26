import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getAuthState } from "../../infrastructure/store/authStore";
import { apiService } from "../../infrastructure/api/apiService";
import type { PlayerProfileDTO, AchievementDTO, StudentHistoryDTO } from "../../infrastructure/api/models/apiModels";
import { PlayerCard } from "../components/Perfil/PlayerCard";
import { StatsGrid } from "../components/Perfil/StatsGrid";
import { AchievementGrid } from "../components/Perfil/AchievementGrid";
import { HistoryTable } from "../components/Perfil/HistoryTable";
import { BsArrowRepeat } from "react-icons/bs";

type Tab = "stats" | "achievements" | "history";

export const PerfilPage = () => {
  const { user } = getAuthState();
  const [searchParams] = useSearchParams();
  const userId = user?.id || user?.email || "";
  const [profile, setProfile] = useState<PlayerProfileDTO | null>(null);
  const [achievements, setAchievements] = useState<AchievementDTO[]>([]);
  const [history, setHistory] = useState<StudentHistoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get("tab") as Tab) || "stats");

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const [p, a, h] = await Promise.all([
          apiService.profile.get(userId),
          apiService.profile.getAchievements(userId),
          apiService.profile.getHistory(userId),
        ]);
        setProfile(p);
        setAchievements(a);
        if (h && h.length > 0) {
          setHistory(h);
        } else {
          const stored = getLocalHistory();
          setHistory(stored);
        }
      } catch {
        setProfile(null);
        setAchievements([]);
        const stored = getLocalHistory();
        setHistory(stored);
      }
      setLoading(false);
    };
    load();
  }, [userId]);

  if (loading) {
    return (
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 font-mono" style={{ color: "var(--text-muted)" }}>
          <BsArrowRepeat className="text-2xl animate-spin" />
          <span className="text-[10px] uppercase tracking-widest">Cargando perfil...</span>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="text-center py-20">
          <p className="text-sm font-mono" style={{ color: "var(--text-muted)" }}>
            No hay datos de perfil disponibles. Completa un reto para generar tu perfil.
          </p>
        </div>
      </main>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "stats", label: "Estadísticas" },
    { id: "achievements", label: "Logros" },
    { id: "history", label: "Historial" },
  ];

  return (
    <main className="flex-1 p-6 max-w-4xl mx-auto w-full" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <PlayerCard profile={profile} />

      <div className="flex gap-6 mt-6 mb-6 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-2 text-[10px] font-mono font-bold uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? "text-primary border-b-2 border-primary"
                : "text-text-muted hover:text-text"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "stats" && <StatsGrid profile={profile} />}
      {activeTab === "achievements" && <AchievementGrid achievements={achievements} />}
      {activeTab === "history" && <HistoryTable history={history} />}
    </main>
  );
};

export default PerfilPage;

function getLocalHistory(): StudentHistoryDTO[] {
  try {
    const stored = localStorage.getItem("pipre_results");
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return parsed.map((r: any, i: number) => ({
      idResult: r.challengeId || `local-${i}`,
      idActivity: r.challengeId || "",
      activityName: r.challengeTitle || "Actividad local",
      score: r.score || 0,
      stars: r.stars || 0,
      xpEarned: 0,
      efficiency: 0,
      dateAttempted: r.completedAt || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}
