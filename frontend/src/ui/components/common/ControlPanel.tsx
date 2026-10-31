import { Timer, Move, RotateCcw, Lightbulb, CircleCheck } from "lucide-react";
import { useGameStore } from "../../../infrastructure/store/gameStore";
export interface ControlPanelProps { onCheck: () => void; onReset?: () => void; onHint?: () => void; hintKind?: 'static'|'ai'; hintCount?: number; }
const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
export const ControlPanel = ({ onCheck, onReset, onHint, hintKind='ai', hintCount }: ControlPanelProps) => {
  const status = useGameStore(s => s.status);
  const time = useGameStore(s => s.tiempoResolucion);
  const moves = useGameStore(s => s.movimientos);
  const resets = useGameStore(s => s.reinicios);
  const hints = useGameStore(s => s.pistasIa);
  const resetGame = useGameStore(s => s.resetGame);
  const requestHint = useGameStore(s => s.requestHint);
  const playing = status === "PLAYING";
  return <section aria-label="Controles de la partida" className="w-full border-t border-border pt-4">
    <div className="flex flex-wrap justify-center gap-3">
      <button onClick={onCheck} disabled={!playing} className="btn-premium"><CircleCheck size={18} aria-hidden="true" />Comprobar</button>
      <button onClick={() => { resetGame(); onReset?.(); }} disabled={!playing} className="btn-secondary"><RotateCcw size={18} aria-hidden="true" />Reiniciar</button>
      <button onClick={() => { if(hintKind==='ai')requestHint(); onHint?.(); }} disabled={!playing} className="btn-secondary"><Lightbulb size={18} aria-hidden="true" />Pista</button>
    </div>
    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 text-center">
      {[[Timer, "Tiempo", formatTime(time)], [Move, "Movimientos", moves], [RotateCcw, "Reinicios", resets], [Lightbulb, "Pistas", hintCount??hints]].map(([Icon, label, value]) => {
        const MetricIcon = Icon as typeof Timer;
        return <div key={String(label)} className="rounded-lg bg-surface-brighter px-2 py-3"><dt className="text-xs text-text-muted flex items-center justify-center gap-1.5"><MetricIcon size={14} aria-hidden="true" />{String(label)}</dt><dd className="mt-1 font-mono text-lg font-bold tabular-nums">{String(value)}</dd></div>;
      })}
    </dl>
  </section>;
};
