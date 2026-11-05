import { Link } from "react-router-dom";
import { useDailySet } from "./useDailySet";

export function DailySetList({ studentId }: { studentId: string }) {
  const { daily, error, retry } = useDailySet(studentId);
  if (error) return <div><p role="alert">No pudimos consultar los cinco retos.</p><button className="btn-secondary" onClick={retry}>Reintentar retos</button></div>;
  if (!daily) return <p role="status">Preparando cinco retos diarios…</p>;
  return <div className="mt-4"><p className="mb-3 font-semibold">{daily.challenges.filter(c => c.completedAt).length}/5 retos completados · Vigentes hasta la medianoche de Lima</p><div className="flex flex-wrap gap-3">{daily.challenges.map(c => <Link key={c.id} className="btn-secondary" to={`/simulador?daily=true&challenge=${c.id}`}>
    {c.slot}. {c.game === "neonflow" ? "Neon Flow" : "TetriLogic"}{c.completedAt ? ` · ${c.bestStars}/3 ★` : ""}
  </Link>)}</div></div>;
}
