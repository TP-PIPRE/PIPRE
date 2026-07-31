import React, { useState, useEffect, useRef } from "react";
import { BsArrowRight, BsXLg, BsRobot } from "react-icons/bs";

interface TutorialStep {
  targetId: string;
  title: string;
  text: string;
  position: "left" | "right" | "top" | "bottom" | "center";
  needsTab?: { side: "left" | "right"; tab: string };
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    targetId: "stage-3d",
    title: "Bienvenido a PIPRE!",
    text: "Soy PIP-E. Este es tu robot. Programalo con bloques para que cobre vida en este mundo 3D.",
    position: "center",
  },
  {
    targetId: "panel-hardware",
    title: "Equipa tu robot",
    text: "Arrastra componentes como Ruedas a los puertos de hardware. Sin hardware, el robot no puede hacer nada!",
    position: "left",
    needsTab: { side: "left", tab: "hardware" },
  },
  {
    targetId: "panel-toolbox",
    title: "Bloques de programacion",
    text: "Arrastra bloques desde aqui al area de trabajo. Cada bloque es una instruccion para tu robot.",
    position: "left",
    needsTab: { side: "left", tab: "blocks" },
  },
  {
    targetId: "btn-ejecutar",
    title: "Ejecuta tu programa!",
    text: "Presiona EJECUTAR para ver a tu robot en accion. Tambien podes usar Paso a Paso para ver cada instruccion.",
    position: "bottom",
  },
  {
    targetId: "panel-missions",
    title: "Completa niveles!",
    text: "Gana estrellas completando niveles. Cada mundo tiene 3 niveles que enseñan nuevos conceptos. Diviertete!",
    position: "right",
    needsTab: { side: "right", tab: "missions" },
  },
];

export const TutorialOverlay: React.FC<{
  onComplete: () => void;
  onSkip: () => void;
  setLeftTab?: (tab: string) => void;
  setRightTab?: (tab: string) => void;
}> = ({ onComplete, onSkip, setLeftTab, setRightTab }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [bubblePos, setBubblePos] = useState({ top: 0, left: 0 });
  const retryRef = useRef(0);

  const step = TUTORIAL_STEPS[currentStep];
  const isLast = currentStep === TUTORIAL_STEPS.length - 1;

  useEffect(() => {
    if (step.needsTab) {
      if (step.needsTab.side === "left") setLeftTab?.(step.needsTab.tab);
      if (step.needsTab.side === "right") setRightTab?.(step.needsTab.tab);
    }

    const findEl = () => {
      const el = document.getElementById(step.targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        switch (step.position) {
          case "left": setBubblePos({ top: rect.top + rect.height / 2 - 60, left: rect.right + 20 }); break;
          case "right": setBubblePos({ top: rect.top + rect.height / 2 - 60, left: rect.left - 320 }); break;
          case "top": setBubblePos({ top: rect.bottom + 10, left: rect.left + rect.width / 2 - 150 }); break;
          case "bottom": setBubblePos({ top: rect.top - 180, left: rect.left + rect.width / 2 - 150 }); break;
          default: setBubblePos({ top: window.innerHeight / 2 - 80, left: window.innerWidth / 2 - 150 }); break;
        }
      } else {
        retryRef.current += 1;
        if (retryRef.current < 10) {
          setTimeout(findEl, 200);
        } else {
          setBubblePos({ top: window.innerHeight / 2 - 80, left: window.innerWidth / 2 - 150 });
        }
      }
    };
    retryRef.current = 0;
    setTimeout(findEl, 100);
  }, [currentStep, step]);

  const next = () => {
    if (isLast) { onComplete(); }
    else { setCurrentStep((p) => p + 1); }
  };

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-auto">
      <div className="absolute inset-0 bg-black/70" />
      <div
        className="absolute bg-surface border-2 border-primary/30 rounded-2xl p-4 shadow-2xl max-w-[300px] z-10 animate-fade-in-soft"
        style={{ top: Math.max(10, bubblePos.top), left: Math.max(10, Math.min(bubblePos.left, window.innerWidth - 310)) }}
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
        <p className="text-xs text-text-muted leading-relaxed mb-3">{step.text}</p>
        <div className="flex justify-between items-center">
          <button onClick={onSkip} className="text-[10px] text-text-muted hover:text-text flex items-center gap-1">
            <BsXLg className="text-[10px]" /> Saltar
          </button>
          <button
            onClick={next}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-xl hover:brightness-110 transition-all"
          >
            {isLast ? "Empezar!" : "Siguiente"} <BsArrowRight className="text-xs" />
          </button>
        </div>
      </div>
    </div>
  );
};
