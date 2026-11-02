import { CheckCircle2, Star } from "lucide-react";
import type { ValidatedSessionState } from "../../../infrastructure/store/validatedGameSession";

export function GameSessionFeedback({ state, retry, onNewAttempt }: { state: ValidatedSessionState | null; retry: () => void; onNewAttempt?:()=>void }) {
  if (!state) return null;
  if (state.phase === "starting") return <p role="status" className="p-4 text-center text-text-muted">Preparando tu intento…</p>;
  if (state.phase === "error") return <div className="my-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-danger p-4"><p role="alert" className="text-sm text-text">{state.error}</p><div className="flex flex-wrap gap-2"><button className="btn-secondary" onClick={retry}>Reintentar envío</button>{onNewAttempt && <button className="btn-secondary" onClick={onNewAttempt}>Nuevo intento</button>}</div></div>;
  if (state.phase === "verifying") return <p role="status" className="my-4 text-sm text-text-muted">Verificando y guardando tu resultado…</p>;
  if (state.victory) return <div role="status" className="my-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-primary/10 p-4 text-sm"><CheckCircle2 size={20} aria-hidden="true" className="text-success" /><strong>Resultado guardado</strong><span aria-label={`${state.victory.stars} de 3 estrellas`} className="inline-flex gap-1">{[1, 2, 3].map(value => <Star key={value} size={18} aria-hidden="true" className={value <= state.victory!.stars ? "fill-primary text-primary" : "text-text-muted"} />)}</span><span className="text-text-muted">Mejor resultado: {state.victory.bestStars}/3. Reinicia para volver a intentarlo.</span>{state.victory.daily?.completed && <span className="font-semibold text-success">Reto diario completado.</span>}</div>;
  if (state.rejected) return <p role="status" className="my-3 text-sm text-danger">El último movimiento no pudo validarse. Restablece el tablero si los estados no coinciden.</p>;
  return null;
}
