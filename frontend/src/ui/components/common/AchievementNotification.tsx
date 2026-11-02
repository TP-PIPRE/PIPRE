import { Award, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAchievementStore } from "../../../infrastructure/store/achievementStore";
import { getAuthState } from "../../../infrastructure/store/authStore";

export function AchievementNotification() {
  const studentId = getAuthState().user?.id;
  const notifications = useAchievementStore(state => state.notifications).filter(item => item.studentId === studentId);
  const dismiss = useAchievementStore(state => state.dismiss);
  if (!studentId || !notifications.length) return null;
  return <aside className="mb-5 flex flex-wrap items-start gap-3 rounded-xl border border-primary bg-surface p-4" aria-label="Nuevos logros">
    <Award size={24} aria-hidden="true" className="shrink-0 text-primary" />
    <div className="min-w-0 flex-1"><p role="status" aria-atomic="true" className="font-semibold">{notifications.length === 1 ? "Logro desbloqueado" : `${notifications.length} logros desbloqueados`}: {notifications.map(item => item.achievement.name).join(", ")}</p><Link to="/perfil?tab=achievements" className="mt-1 inline-flex min-h-11 items-center font-semibold text-primary">Ver mis logros</Link></div>
    <button type="button" className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border" aria-label="Cerrar notificación de logros" onClick={() => dismiss(studentId)}><X size={18} aria-hidden="true" /></button>
  </aside>;
}
