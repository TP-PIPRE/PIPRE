import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { BsTrophyFill } from "react-icons/bs";

interface CelebrationOverlayProps {
  score: number;
  blocks: number;
  energy: number;
  challengeTitle: string;
  onNext: () => void;
  onExit: () => void;
}

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  score,
  blocks,
  energy,
  challengeTitle,
  onNext,
  onExit,
}) => {
  useEffect(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.6 },
        colors: ["#00e5ff", "#76ff03", "#ffea00", "#ff3d00", "#d500f9"],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.6 },
        colors: ["#00e5ff", "#76ff03", "#ffea00", "#ff3d00", "#d500f9"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-sm mx-4 p-6 border border-primary/30 text-center animate-scale-up"
        style={{
          backgroundColor: "var(--surface)",
          borderRadius: "var(--theme-radius)",
          boxShadow: "0 0 60px rgba(var(--primary-rgb), 0.15)",
        }}
      >
        <BsTrophyFill className="text-4xl mb-4 mx-auto" style={{ color: "var(--primary)" }} />

        <h2
          className="text-xl font-bold mb-1"
          style={{ color: "var(--text)" }}
        >
          Reto Completado
        </h2>

        <p
          className="text-xs text-text-muted/70 mb-6 font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          {challengeTitle}
        </p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div
            className="p-3 border border-border/20"
            style={{
              borderRadius: "var(--theme-radius)",
              backgroundColor: "var(--bg)",
            }}
          >
            <div
              className="text-[9px] uppercase tracking-widest font-bold mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              Puntaje
            </div>
            <div
              className="text-lg font-black"
              style={{ color: "var(--primary)" }}
            >
              {score.toLocaleString()}
            </div>
          </div>

          <div
            className="p-3 border border-border/20"
            style={{
              borderRadius: "var(--theme-radius)",
              backgroundColor: "var(--bg)",
            }}
          >
            <div
              className="text-[9px] uppercase tracking-widest font-bold mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              Bloques
            </div>
            <div
              className="text-lg font-black"
              style={{ color: "var(--accent)" }}
            >
              {blocks}
            </div>
          </div>

          <div
            className="p-3 border border-border/20"
            style={{
              borderRadius: "var(--theme-radius)",
              backgroundColor: "var(--bg)",
            }}
          >
            <div
              className="text-[9px] uppercase tracking-widest font-bold mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              Energía
            </div>
            <div
              className="text-lg font-black"
              style={{ color: energy > 50 ? "var(--success)" : "var(--danger)" }}
            >
              {energy}%
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onExit}
            className="flex-1 btn-secondary py-3 text-[10px] font-black uppercase tracking-widest"
            style={{ borderRadius: "var(--theme-radius)" }}
          >
            Volver a Cursos
          </button>
          <button
            onClick={onNext}
            className="flex-[2] btn-premium py-3 text-[10px] font-black uppercase tracking-widest"
            style={{ borderRadius: "var(--theme-radius)" }}
          >
            Siguiente Reto
          </button>
        </div>
      </div>
    </div>
  );
};
