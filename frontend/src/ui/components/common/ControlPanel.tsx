import { useGameStore } from "../../../infrastructure/store/gameStore";
import { BsArrowCounterclockwise, BsArrowsMove, BsClockFill, BsLightbulbFill, BsPatchCheckFill } from "react-icons/bs";

export interface ControlPanelProps {
  onCheck: () => void;
  onReset?: () => void;
  onHint?: () => void;
}

const formatTime = (seconds: number): string =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

export const ControlPanel: React.FC<ControlPanelProps> = ({ onCheck, onReset, onHint }) => {
  const status = useGameStore((s) => s.status);
  const tiempoResolucion = useGameStore((s) => s.tiempoResolucion);
  const movimientos = useGameStore((s) => s.movimientos);
  const reinicios = useGameStore((s) => s.reinicios);
  const pistasIa = useGameStore((s) => s.pistasIa);
  const resetGame = useGameStore((s) => s.resetGame);
  const requestHint = useGameStore((s) => s.requestHint);

  const playing = status === "PLAYING";

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-surface border border-border shadow-lg p-3">
      <button
        onClick={onCheck}
        disabled={!playing}
        className="flex items-center gap-1.5 rounded-lg bg-green-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-40">
        <BsPatchCheckFill className="text-sm" />
        Comprobar
      </button>
      <button
        onClick={() => {
          resetGame();
          onReset?.();
        }}
        disabled={!playing}
        className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-40">
        <BsArrowCounterclockwise className="text-sm" />
        Reiniciar
      </button>
      <button
        onClick={() => {
          requestHint();
          onHint?.();
        }}
        disabled={!playing}
        className="flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40">
        <BsLightbulbFill className="text-sm" />
        Pista
      </button>

      <div className="ml-auto flex flex-wrap items-center gap-4 text-[11px] font-bold text-text-muted">
        <span className="flex items-center gap-1">
          <BsClockFill className="text-xs" />
          {formatTime(tiempoResolucion)}
        </span>
        <span className="flex items-center gap-1">
          <BsArrowsMove className="text-xs" />
          {movimientos}
        </span>
        <span className="flex items-center gap-1">
          <BsArrowCounterclockwise className="text-xs" />
          {reinicios}
        </span>
        <span className="flex items-center gap-1">
          <BsLightbulbFill className="text-xs" />
          {pistasIa}
        </span>
      </div>
    </div>
  );
};
