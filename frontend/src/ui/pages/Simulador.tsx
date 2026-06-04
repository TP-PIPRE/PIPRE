/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SimuladorProvider, useSimulador } from "../../application/context/SimuladorProvider";
import { HardwarePanel } from "../components/Simulador/HardwarePanel";
import { Toolbox } from "../components/Simulador/Toolbox";
import { Workspace } from "../components/Simulador/Workspace";
import { Stage3D } from "../components/Simulador/Stage3D";
import { Console } from "../components/Simulador/Console";
import { MissionsPanel } from "../components/Simulador/MissionsPanel";
import { ENVIRONMENT_CONFIGS } from "../../shared/constants/environmentConfigs";
import type { EnvironmentType } from "../../shared/types/Simulador";

const ENVIRONMENTS: { id: EnvironmentType; icon: string }[] = [
  { id: "battle", icon: "sports_kabaddi" },
  { id: "space", icon: "rocket_launch" },
  { id: "maze", icon: "auto_awesome" },
  { id: "obstacle", icon: "speed" },
];

const EnvironmentSelector = () => {
  const { environment, setEnvironment, isFreeMode } = useSimulador();

  if (!isFreeMode) return null;

  return (
    <div className="flex gap-2 px-4 py-3 border-b border-border" style={{ backgroundColor: "var(--surface)" }}>
      <span className="font-mono text-[10px] text-text-muted uppercase tracking-widest mr-2 self-center">
        Entorno:
      </span>
      {ENVIRONMENTS.map((env) => {
        const config = ENVIRONMENT_CONFIGS[env.id];
        const isActive = environment === env.id;
        return (
          <button
            key={env.id}
            onClick={() => setEnvironment(env.id)}
            className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all border rounded-lg ${
              isActive
                ? "bg-primary/20 text-primary border-primary/40 shadow-[0_0_10px_var(--primary-glow)]"
                : "bg-surface-brighter text-text-muted border-border hover:border-primary/30 hover:text-text"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{env.icon}</span>
            {config?.name || env.id}
          </button>
        );
      })}
    </div>
  );
};

const SimuladorInner = () => {
  const { courseId } = useParams<{ courseId?: string }>();
  const navigate = useNavigate();
  const { loadChallengeFromCourse, isFreeMode, setFreeMode, challenges, selectChallenge, challengeData } = useSimulador();
  const [showChallengeList, setShowChallengeList] = useState(false);

  useEffect(() => {
    if (courseId) {
      loadChallengeFromCourse(courseId);
    } else {
      setFreeMode();
    }
  }, [courseId]);

  const handleBackToCourses = () => {
    setFreeMode();
    navigate("/cursos");
  };

  return (
    <div className="flex flex-col h-screen">
      <EnvironmentSelector />

      {/* Challenge mode banner */}
      {!isFreeMode && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border" style={{ backgroundColor: "var(--surface-brighter)" }}>
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToCourses}
              className="font-mono text-[10px] text-text-muted hover:text-primary transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">arrow_back</span>
              Cursos
            </button>
            <span className="text-text-muted/30">|</span>
            <span className="font-mono text-[10px] text-text-muted uppercase tracking-widest">
              Modo Reto
            </span>
            <span className="text-[8px] font-mono px-2 py-0.5 border border-yellow-500/30 uppercase tracking-widest" style={{ backgroundColor: "rgba(234,179,8,0.1)", borderRadius: "var(--theme-radius)", color: "var(--text-muted)" }}>
              Demo
            </span>
            {challengeData && (
              <>
                <span className="text-text-muted/30">|</span>
                <span className="font-mono text-xs text-primary font-bold">
                  {challengeData.title}
                </span>
              </>
            )}
          </div>

          {challenges.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowChallengeList(!showChallengeList)}
                className="font-mono text-[10px] text-primary hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">list</span>
                Cambiar Reto
              </button>
              {showChallengeList && (
                <div className="absolute right-0 top-full mt-1 z-50 border border-border rounded-lg shadow-xl" style={{ backgroundColor: "var(--surface)", minWidth: "200px" }}>
                  {challenges.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => {
                        selectChallenge(ch);
                        setShowChallengeList(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-[11px] font-mono hover:bg-surface-brighter transition-colors border-b border-border last:border-b-0 ${
                        challengeData?.id === ch.id ? "text-primary font-bold" : "text-text"
                      }`}
                    >
                      <div>{ch.title}</div>
                      <div className="text-[9px] text-text-muted">{ch.difficulty} • {ch.points} pts</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <main className="flex-1 p-4 overflow-auto">
        <div className="h-full w-full max-w-[1920px] mx-auto grid grid-cols-12 grid-rows-[repeat(12,minmax(0,1fr))] gap-4">
          {/* Column 1: Hardware & Missions (3 cols) */}
          <div className="col-span-3 row-span-12 flex flex-col gap-4 min-h-0">
            <div
              className="min-h-0 panel-border flex-1 overflow-auto rounded-lg"
              style={{ backgroundColor: "var(--surface)" }}
            >
              <HardwarePanel />
            </div>
            <div
              className="min-h-0 panel-border flex-1 overflow-auto rounded-lg"
              style={{ backgroundColor: "var(--surface)" }}
            >
              <MissionsPanel />
            </div>
          </div>

          {/* Column 2: Logic Assembly (5 cols) */}
          <div
            className="col-span-5 row-span-12 flex flex-col panel-border min-h-0 rounded-lg"
            style={{ backgroundColor: "var(--surface)" }}
          >
            <div className="flex h-full">
              <div
                className="w-1/3 border-r border-border rounded-l-lg"
                style={{ backgroundColor: "var(--surface)" }}
              >
                <Toolbox />
              </div>
              <div
                className="w-2/3"
                style={{ backgroundColor: "var(--surface)" }}
              >
                <Workspace />
              </div>
            </div>
          </div>

          {/* Column 3: Visualization & Console (4 cols) */}
          <div className="col-span-4 row-span-12 flex flex-col gap-4 min-h-0">
            <div
              className="flex-1 min-h-0 relative panel-border rounded-lg"
              style={{ backgroundColor: "var(--surface)" }}
            >
              <Stage3D />
            </div>
            <div
              className="h-48 shrink-0 panel-border rounded-lg"
              style={{ backgroundColor: "var(--surface)" }}
            >
              <Console />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export const Simulador = () => {
  return (
    <SimuladorProvider>
      <SimuladorInner />
    </SimuladorProvider>
  );
};
