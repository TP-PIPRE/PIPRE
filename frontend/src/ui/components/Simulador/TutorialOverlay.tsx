import React, { useState, useEffect } from "react";
import { BsArrowRight, BsXLg, BsRobot } from "react-icons/bs";

interface TutorialStep {
  targetId: string;
  title: string;
  text: string;
  position: "left" | "right" | "top" | "bottom" | "center";
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    targetId: "stage-3d",
    title: "Bienvenido a PIPRE!",
    text: "Soy PIP-E, tu asistente robot. Te voy a enseñar a programar robots. Este es el mundo 3D donde tu robot cobra vida.",
    position: "center",
  },
  {
    targetId: "panel-hardware",
    title: "Equipa tu robot",
    text: "Arrastra componentes como Ruedas o Cañón Láser a los puertos de hardware.",
    position: "left",
  },
  {
    targetId: "panel-toolbox",
    title: "Librería de Bloques",
    text: "Aqui estan los bloques de programacion. Arrastralos al area de trabajo.",
    position: "left",
  },
  {
    targetId: "block-avanzar",
    title: "Arrastra un bloque",
    text: "Toma el bloque AVANZAR y sueltalo en el area de trabajo central.",
    position: "left",
  },
  {
    targetId: "workspace-area",
    title: "Area de trabajo",
    text: "Los bloques se conectan como piezas de puzzle. Ordenalos para crear tu programa.",
    position: "center",
  },
  {
    targetId: "btn-ejecutar",
    title: "Ejecutar!",
    text: "Cuando tengas tus bloques listos, presiona EJECUTAR para ver a tu robot en accion.",
    position: "bottom",
  },
  {
    targetId: "panel-missions",
    title: "Misiones y Niveles",
    text: "Completa misiones para ganar estrellas. Cada nivel es mas dificil y enseña nuevos conceptos.",
    position: "right",
  },
  {
    targetId: "env-selector",
    title: "Explora los mundos",
    text: "Tienes 4 mundos: Batalla, Espacio, Laberinto y Carrera. Cada uno con mecanicas unicas. Ya estas listo para empezar!",
    position: "top",
  },
];

export const TutorialOverlay: React.FC<{
  onComplete: () => void;
  onSkip: () => void;
}> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [bubblePos, setBubblePos] = useState({ top: 0, left: 0 });
  const [spotlightPos, setSpotlightPos] = useState({ top: 0, left: 0, width: 0, height: 0 });

  const step = TUTORIAL_STEPS[currentStep];
  const isLast = currentStep === TUTORIAL_STEPS.length - 1;

  const updatePositions = () => {
    const el = document.getElementById(step.targetId);
    if (el) {
      const rect = el.getBoundingClientRect();
      setSpotlightPos({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });

      switch (step.position) {
        case "left":
          setBubblePos({
            top: rect.top + rect.height / 2 - 60,
            left: rect.right + 20,
          });
          break;
        case "right":
          setBubblePos({
            top: rect.top + rect.height / 2 - 60,
            left: rect.left - 320,
          });
          break;
        case "top":
          setBubblePos({
            top: rect.bottom + 10,
            left: rect.left + rect.width / 2 - 150,
          });
          break;
        case "bottom":
          setBubblePos({
            top: rect.top - 170,
            left: rect.left + rect.width / 2 - 150,
          });
          break;
        default:
          setBubblePos({
            top: window.innerHeight / 2 - 80,
            left: window.innerWidth / 2 - 150,
          });
          break;
      }
    } else {
      setSpotlightPos({ top: 0, left: 0, width: 0, height: 0 });
      setBubblePos({
        top: window.innerHeight / 2 - 80,
        left: window.innerWidth / 2 - 150,
      });
    }
  };

  useEffect(() => {
    updatePositions();
    const handleResize = () => updatePositions();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [currentStep, step.targetId, step.position]);

  const next = () => {
    if (isLast) {
      onComplete();
    } else {
      setCurrentStep((p) => p + 1);
    }
  };

  const clampBubble = (pos: { top: number; left: number }) => ({
    top: Math.max(10, Math.min(pos.top, window.innerHeight - 200)),
    left: Math.max(10, Math.min(pos.left, window.innerWidth - 320)),
  });

  const clamped = clampBubble(bubblePos);

  const hasSpotlight =
    spotlightPos.width > 0 && spotlightPos.height > 0;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-auto select-none">
      {/* Spotlight overlay using box-shadow */}
      <div
        className="absolute inset-0 transition-all duration-400 ease-in-out"
        style={
          hasSpotlight
            ? {
                boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.7)`,
                top: spotlightPos.top - 8,
                left: spotlightPos.left - 8,
                width: spotlightPos.width + 16,
                height: spotlightPos.height + 16,
                borderRadius: 12,
                background: "transparent",
                zIndex: 1,
              }
            : {
                background: "rgba(0, 0, 0, 0.7)",
                zIndex: 1,
              }
        }
      />

      {/* Speech bubble */}
      <div
        className="absolute bg-surface border-2 border-primary/30 rounded-2xl p-4 shadow-2xl max-w-[300px] z-10 animate-fade-in-soft"
        style={{
          top: clamped.top,
          left: clamped.left,
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <BsRobot className="text-primary text-base" />
          </div>
          <span className="text-[10px] text-text-muted font-bold">
            Paso {currentStep + 1}/{TUTORIAL_STEPS.length}
          </span>
        </div>
        <h3 className="text-sm font-bold text-text mb-1">{step.title}</h3>
        <p className="text-xs text-text-muted leading-relaxed mb-3">
          {step.text}
        </p>
        <div className="flex justify-between items-center">
          <button
            onClick={onSkip}
            className="text-[10px] text-text-muted hover:text-text flex items-center gap-1"
          >
            <BsXLg className="text-[10px]" /> Saltar
          </button>
          <button
            onClick={next}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-xl hover:brightness-110 transition-all"
          >
            {isLast ? "Empezar!" : "Siguiente"}{" "}
            <BsArrowRight className="text-xs" />
          </button>
        </div>
      </div>
    </div>
  );
};
