import type { DailySetDTO } from "../../../infrastructure/api/models/gameProgressModels";

export function DailyProgress({ daily }: { daily: DailySetDTO }) {
  const completed = daily.challenges.filter(c => c.completedAt).length;
  const percent = completed * 20;
  const status = completed === 5 ? "Completado" : completed > 0 ? "En progreso" : "Pendiente";
  return <div className="my-4" aria-live="polite">
    <p className="mb-2 text-sm font-semibold">{completed}/5 ejercicios completados · {percent} % · {status}</p>
    <progress aria-label="Progreso del reto diario" value={completed} max={5} className="h-3 w-full accent-primary" />
  </div>;
}
