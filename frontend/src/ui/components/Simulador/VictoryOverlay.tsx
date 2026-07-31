import React, { useState, useEffect } from "react";
import { BsStarFill, BsTrophyFill, BsArrowRight, BsArrowRepeat } from "react-icons/bs";

interface VictoryOverlayProps {
  levelName: string;
  stars: number;
  score: number;
  blocksUsed: number;
  maxBlocks: number;
  hasNextLevel: boolean;
  onNextLevel: () => void;
  onRetry: () => void;
  onExit: () => void;
}

export const VictoryOverlay: React.FC<VictoryOverlayProps> = ({
  levelName,
  stars,
  score,
  blocksUsed,
  maxBlocks,
  hasNextLevel,
  onNextLevel,
  onRetry,
  onExit,
}) => {
  const [visibleStars, setVisibleStars] = useState(0);

  useEffect(() => {
    let mounted = true;
    for (let i = 0; i < stars; i++) {
      setTimeout(() => { if (mounted) setVisibleStars(i + 1); }, 500 + i * 400);
    }
    return () => { mounted = false; };
  }, [stars]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in-soft">
      <div className="bg-surface border-2 border-amber-500/30 rounded-2xl p-6 max-w-[340px] w-full shadow-2xl animate-scale-up-soft text-center">
        <div className="flex justify-center gap-1.5 mb-3">
          {[0, 1, 2].map((i) => (
            <BsStarFill
              key={i}
              className={`text-3xl transition-all ${
                i < visibleStars ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] animate-scale-up-soft" : "text-border/30"
              }`}
              style={{ transitionDelay: `${i * 200}ms` }}
            />
          ))}
        </div>

        <h2 className="text-lg font-black text-text mb-1">Nivel Completado!</h2>
        <p className="text-sm text-amber-400 font-bold mb-4">{levelName}</p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-bg rounded-xl p-2.5">
            <BsTrophyFill className="text-amber-400 text-lg mx-auto mb-1" />
            <div className="text-lg font-black text-text">{score}</div>
            <div className="text-[10px] text-text-muted">puntos</div>
          </div>
          <div className="bg-bg rounded-xl p-2.5">
            <div className="text-lg font-black" style={{ color: blocksUsed <= maxBlocks ? "#22c55e" : "#ef4444" }}>
              {blocksUsed}/{maxBlocks}
            </div>
            <div className="text-[10px] text-text-muted">bloques</div>
          </div>
        </div>

        {visibleStars === 3 && (
          <div className="text-xs text-amber-400 font-bold mb-3 animate-bounce-soft">
            Excelente eficiencia!
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 border border-border rounded-xl text-xs font-bold text-text-muted hover:border-primary/40 hover:text-text transition-all"
          >
            <BsArrowRepeat className="text-sm" /> Repetir
          </button>
          {hasNextLevel ? (
            <button
              onClick={onNextLevel}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:brightness-110 shadow-lg shadow-primary/25 transition-all"
            >
              Siguiente <BsArrowRight className="text-sm" />
            </button>
          ) : (
            <button
              onClick={onExit}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-bold hover:brightness-110 shadow-lg shadow-amber-500/25 transition-all"
            >
              Completado!
            </button>
          )}
        </div>

        <button
          onClick={onExit}
          className="w-full mt-2 text-[11px] text-text-muted/50 hover:text-text-muted transition-colors"
        >
          Volver a seleccion de niveles
        </button>
      </div>
    </div>
  );
};
