import { Award, CheckCircle2, Flame, LockKeyhole, Timer, Trophy } from "lucide-react";
import type { AchievementDTO } from "../../../infrastructure/api/models/apiModels";

const categories = [
  { id: "progreso", name: "Progreso", Icon: Trophy, description: "Completa el mismo nivel en los dos simuladores." },
  { id: "constancia", name: "Constancia", Icon: Flame, description: "Completa el reto diario en días consecutivos." },
  { id: "velocidad", name: "Velocidad", Icon: Timer, description: "Encadena tres niveles consecutivos de un mismo juego." },
  { id: "maestria", name: "Maestría", Icon: Award, description: "Mejora hasta conseguir tres estrellas en todos los niveles." },
];

function formatAchievementDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Fecha no disponible" : new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeZone: "America/Lima" }).format(date);
}

export const AchievementGrid = ({ achievements }: { achievements: AchievementDTO[] }) => {
  const active = achievements.filter(achievement => achievement.active !== false && /^L(0[1-9]|[12]\d|3[0-5])$/.test(achievement.code));
  const unlocked = active.filter(achievement => achievement.unlocked).length;
  return <section className="space-y-6" aria-labelledby="achievements-title">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <div><h2 id="achievements-title" className="text-xl font-bold">Tus logros</h2><p className="mt-1 text-sm text-text-muted">Cada logro se guarda al confirmar tu resultado.</p></div>
      <span className="rounded-lg border border-border bg-surface px-4 py-3 font-mono text-sm" aria-label={`${unlocked} de 35 logros desbloqueados`}>{unlocked}<span className="text-text-muted"> / 35</span></span>
    </header>
    {active.length === 0 ? <p className="rounded-xl border border-border bg-surface p-6 text-text-muted">El catálogo de logros no está disponible. Actualiza el perfil para volver a consultarlo.</p> : categories.map(({ id, name, Icon, description }) => {
      const items = active.filter(achievement => achievement.category.toLowerCase() === id).sort((a, b) => a.code.localeCompare(b.code));
      return <section key={id} aria-labelledby={`achievement-category-${id}`}>
        <header className="mb-4"><h3 id={`achievement-category-${id}`} className="flex items-center gap-2 text-lg font-semibold"><Icon size={20} aria-hidden="true" />{name}<span className="ml-auto text-sm font-normal text-text-muted">{items.filter(item => item.unlocked).length}/{items.length}</span></h3><p className="mt-1 text-sm text-text-muted">{description}</p></header>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map(achievement => <li key={achievement.idAchievement} className={`min-w-0 rounded-xl border p-4 ${achievement.unlocked ? "border-primary bg-primary/5" : "border-border bg-surface"}`}>
            <div className="mb-3 flex items-center gap-2"><span className="font-mono text-xs text-text-muted">{achievement.code}</span><span className={`ml-auto inline-flex items-center gap-1.5 text-xs font-semibold ${achievement.unlocked ? "text-success" : "text-text-muted"}`}>{achievement.unlocked ? <CheckCircle2 size={15} aria-hidden="true" /> : <LockKeyhole size={15} aria-hidden="true" />}{achievement.unlocked ? "Desbloqueado" : "Por conseguir"}</span></div>
            <h4 className="break-words text-base font-semibold">{achievement.name}</h4>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">{achievement.unlockCondition || achievement.description}</p>
            {achievement.unlocked && achievement.unlockedAt && <p className="mt-3 border-t border-border pt-3 text-xs text-text-muted">Desbloqueado el <time dateTime={achievement.unlockedAt}>{formatAchievementDate(achievement.unlockedAt)}</time></p>}
          </li>)}
        </ul>
      </section>;
    })}
  </section>;
};
