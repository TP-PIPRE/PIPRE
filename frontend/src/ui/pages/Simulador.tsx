/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { SimuladorProvider, useSimulador } from "../../application/context/SimuladorProvider";
import { getAuthState } from "../../infrastructure/store/authStore";
import { Toolbox } from "../components/Simulador/Toolbox";
import { Workspace } from "../components/Simulador/Workspace";
import { Stage3D } from "../components/Simulador/Stage3D";
import { MissionsPanel } from "../components/Simulador/MissionsPanel";
import { MermaidViewer } from "../components/Simulador/MermaidViewer";
import { TutorialOverlay } from "../components/Simulador/TutorialOverlay";
import { VictoryOverlay } from "../components/Simulador/VictoryOverlay";
import { LevelSelector } from "../components/Simulador/LevelSelector";
import { ENVIRONMENT_CONFIGS } from "../../shared/constants/environmentConfigs";
import type { EnvironmentType } from "../../shared/types/Simulador";
import {
  BsPlayFill, BsStopFill, BsTrashFill, BsSaveFill, BsTrophyFill,
  BsCrosshair, BsRocketFill, BsGrid3X3GapFill, BsSpeedometer2,
  BsDiagram3Fill, BsListUl, BsGearFill, BsXLg, BsLightbulbFill,
} from "react-icons/bs";

const ENVIRONMENTS: { id: EnvironmentType; Icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { id: "battle", Icon: BsCrosshair, color: "#ef4444" },
  { id: "space", Icon: BsRocketFill, color: "#3b82f6" },
  { id: "maze", Icon: BsGrid3X3GapFill, color: "#8b5cf6" },
  { id: "obstacle", Icon: BsSpeedometer2, color: "#f97316" },
];

// ====== INNER COMPONENT ======
const SimuladorInner = () => {
  const { courseId } = useParams<{ courseId?: string }>();
  const {
    loadChallengeFromCourse, setFreeMode,
    environment, setEnvironment,
    submitRobotSimulation, simulationLoading,
    blocks, clearWorkspace, isRunning, executeProgram, stopExecution,
    missions, score, energy,
    executionSpeed, setExecutionSpeed, isStepMode, setStepMode,
    currentLevel, setLevel,
    levelComplete, levelStars, dismissLevelComplete,
  } = useSimulador();

  const [showMermaid, setShowMermaid] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [showEnvironmentPicker, setShowEnvironmentPicker] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const getNextLevelId = (levelId: string): string | null => {
    const num = parseInt(levelId.replace("n", ""), 10);
    if (num < 15) return `n${num + 1}`;
    return null;
  };

  useEffect(() => {
    if (courseId) { loadChallengeFromCourse(courseId); }
    else { setFreeMode(); }
  }, [courseId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("pipre_player_progress");
      if (!raw || !JSON.parse(raw)?.tutorialCompleted) setShowTutorial(true);
    } catch { setShowTutorial(true); }
  }, []);

  const prevEnvRef = useRef(environment);
  useEffect(() => {
    if (prevEnvRef.current !== environment) {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 400);
      prevEnvRef.current = environment;
      return () => clearTimeout(timer);
    }
  }, [environment]);

  const activeMission = missions.findIndex((m) => !m.isCompleted);
  const completedMissions = missions.filter((m) => m.isCompleted).length;

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-black">
      {/* ====== MUNDO 3D FULL SCREEN ====== */}
      <div className="flex-1 relative min-h-0">
        <Stage3D key={environment} />

        {/* ====== LEFT DRAWER - Bloques ====== */}
        {leftDrawerOpen && (
          <div className="absolute left-0 top-0 bottom-0 w-72 z-20 bg-surface/95 backdrop-blur-md border-r border-border shadow-2xl animate-slide-in-left overflow-auto">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <h3 className="text-sm font-bold text-text">Bloques</h3>
              <button onClick={() => setLeftDrawerOpen(false)} className="p-1.5 hover:bg-surface-brighter rounded-lg">
                <BsXLg className="text-sm text-text-muted" />
              </button>
            </div>
            <div className="max-h-[calc(100%-48px)] overflow-auto">
              <Toolbox />
            </div>
          </div>
        )}

        {/* ====== RIGHT DRAWER - Retos ====== */}
        {rightDrawerOpen && (
          <div className="absolute right-0 top-0 bottom-0 w-72 z-20 bg-surface/95 backdrop-blur-md border-l border-border shadow-2xl animate-slide-in-right overflow-auto">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <h3 className="text-sm font-bold text-text">Retos</h3>
              <button onClick={() => setRightDrawerOpen(false)} className="p-1.5 hover:bg-surface-brighter rounded-lg">
                <BsXLg className="text-sm text-text-muted" />
              </button>
            </div>
            <MissionsPanel />
          </div>
        )}

        {/* ====== HUD TOP BAR ====== */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2">
          <div className="flex gap-2">
            <button onClick={() => setLeftDrawerOpen(!leftDrawerOpen)}
              className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all backdrop-blur-sm ${
                leftDrawerOpen ? "bg-primary text-white" : "bg-surface/80 text-text-muted hover:bg-surface"
              }`}>
              <BsListUl className="text-lg" />
            </button>
            <button onClick={() => setRightDrawerOpen(!rightDrawerOpen)}
              className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all backdrop-blur-sm ${
                rightDrawerOpen ? "bg-amber-500 text-white" : "bg-surface/80 text-text-muted hover:bg-surface"
              }`}>
              <BsTrophyFill className="text-lg" />
            </button>
            <button onClick={() => setShowHelp(!showHelp)}
              className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all backdrop-blur-sm ${
                showHelp ? "bg-purple-500 text-white" : "bg-surface/80 text-text-muted hover:bg-surface"
              }`}>
              <BsLightbulbFill className="text-lg" />
            </button>
          </div>

          <div className="flex items-center gap-1 bg-surface/80 backdrop-blur-sm rounded-xl px-2 py-1">
            <BsGearFill className="text-xs text-text-muted" />
            <button onClick={() => setShowEnvironmentPicker(!showEnvironmentPicker)}
              className="text-[10px] font-bold text-text-muted uppercase tracking-wider hover:text-text">
              {ENVIRONMENT_CONFIGS[environment]?.name || "Mundo"}
            </button>
          </div>

          <div className="flex items-center gap-2 bg-surface/80 backdrop-blur-sm rounded-xl px-3 py-1.5">
            <span className="text-[10px] font-bold text-amber-400">{score}</span>
            <span className="text-[10px] text-text-muted/60">pts</span>
            <span className="text-text-muted/20">|</span>
            <span className="text-xs font-bold" style={{ color: energy > 30 ? "#22c55e" : energy > 10 ? "#f59e0b" : "#ef4444" }}>
              {Math.round(energy)}%
            </span>
            {missions.length > 0 && (
              <>
                <span className="text-text-muted/20">|</span>
                <span className="text-[10px] font-bold text-primary">{completedMissions}/{missions.length}</span>
              </>
            )}
          </div>
        </div>

        {/* ====== ENVIRONMENT PICKER (flyout) ====== */}
        {showEnvironmentPicker && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 bg-surface/95 backdrop-blur-md rounded-xl border border-border shadow-2xl p-3 flex gap-2 animate-scale-up-soft">
            {ENVIRONMENTS.map((env) => {
              const Icon = env.Icon;
              const isActive = environment === env.id;
              return (
                <button key={env.id} onClick={() => { setEnvironment(env.id); setShowEnvironmentPicker(false); }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    isActive ? "text-white shadow-lg" : "text-text-muted hover:text-text bg-surface-brighter/50"
                  }`}
                  style={{ backgroundColor: isActive ? env.color : undefined }}>
                  <Icon className="text-sm" />
                  {ENVIRONMENT_CONFIGS[env.id]?.name || env.id}
                </button>
              );
            })}
            <button onClick={() => { setShowLevelSelector(true); setShowEnvironmentPicker(false); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-all">
              <BsTrophyFill className="text-sm" /> Niveles
            </button>
          </div>
        )}

        {/* ====== LEVEL SELECTOR FLYOUT ====== */}
        {showLevelSelector && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 bg-surface/95 backdrop-blur-md rounded-xl border border-border shadow-2xl p-2 max-w-lg w-full animate-scale-up-soft max-h-[70vh] overflow-auto">
            <div className="flex justify-between items-center p-2 border-b border-border mb-2">
              <h3 className="text-sm font-bold text-text">Niveles</h3>
              <button onClick={() => setShowLevelSelector(false)} className="p-1 hover:bg-surface-brighter rounded-lg">
                <BsXLg className="text-sm text-text-muted" />
              </button>
            </div>
            <LevelSelector
              onSelectLevel={(levelId) => { setLevel(levelId); setShowLevelSelector(false); }}
              selectedLevelId={currentLevel?.id || null}
            />
          </div>
        )}

        {/* ====== HELP TOOLTIP ====== */}
        {showHelp && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 bg-surface/95 backdrop-blur-md rounded-xl border border-purple-500/30 shadow-2xl p-4 max-w-sm animate-scale-up-soft text-center">
            <BsLightbulbFill className="text-2xl text-purple-400 mx-auto mb-2" />
            <p className="text-xs text-text leading-relaxed">
              {currentLevel?.objective || (activeMission >= 0 ? missions[activeMission]?.objective : "Intenta llegar al beacon dorado usando bloques de movimiento.")}
            </p>
            <button onClick={() => setShowHelp(false)} className="mt-2 text-[10px] text-text-muted hover:text-text">
              Entendido
            </button>
          </div>
        )}

                {/* ====== WORKSPACE OVERLAY (semi-transparent) ====== */}
        {showWorkspace && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/20 backdrop-blur-[2px]"
               onClick={() => setShowWorkspace(false)}>
            <div className="bg-surface/85 backdrop-blur-md border border-border rounded-2xl shadow-2xl w-[85vw] max-w-[900px] h-[90vh] flex flex-col p-4"
                 onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-text">Programa ({blocks.length} bloques)</h3>
                <button onClick={() => setShowWorkspace(false)} className="p-1.5 hover:bg-surface-brighter rounded-lg">
                  <BsXLg className="text-sm text-text-muted" />
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-auto">
                <Workspace />
              </div>
            </div>
          </div>
        )}
        {currentLevel && (
          <div className="absolute top-16 left-4 z-10 bg-surface/80 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-border/30 max-w-[200px]">
            <div className="text-[10px] font-bold text-amber-400">{currentLevel.name}</div>
            <div className="text-[9px] text-text-muted/70 mt-0.5">{currentLevel.description}</div>
          </div>
        )}
      </div>

      {/* ====== TOOLBAR INFERIOR ====== */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-2.5 border-t border-border bg-surface">
        <div className="flex gap-2">
          <button onClick={() => setShowWorkspace(true)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
              showWorkspace ? "bg-primary text-white" : blocks.length > 0 ? "border-2 border-primary/40 text-primary bg-primary/5" : "text-text-muted hover:text-text border border-border"
            }`}>
            📝 Bloques {blocks.length > 0 && `(${blocks.length})`}
          </button>
          <button onClick={isRunning ? stopExecution : executeProgram}
            disabled={!isRunning && blocks.length === 0}
            id="btn-ejecutar"
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
              isRunning ? "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25"
                : "bg-primary text-white hover:brightness-110 shadow-lg shadow-primary/25 disabled:opacity-40 disabled:shadow-none"
            }`}>
            {isRunning ? <><BsStopFill className="text-sm" /> Detener</> : <><BsPlayFill className="text-sm" /> Ejecutar</>}
          </button>
          <button onClick={clearWorkspace} disabled={isRunning || blocks.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-text-muted hover:text-text hover:bg-surface-brighter/60 rounded-xl disabled:opacity-30">
            <BsTrashFill className="text-sm" /> Limpiar
          </button>
          <button onClick={() => setShowMermaid(true)} disabled={blocks.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-text-muted hover:text-text hover:bg-surface-brighter/60 rounded-xl disabled:opacity-30">
            <BsDiagram3Fill className="text-sm" />
          </button>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-muted font-bold">Vel</span>
          <input type="range" min="50" max="800" step="50" value={executionSpeed}
            onChange={(e) => setExecutionSpeed(parseInt(e.target.value))}
            className="w-16 h-1.5 accent-primary cursor-pointer" disabled={isRunning} />
          <button onClick={() => setStepMode(!isStepMode)}
            disabled={isRunning && !isStepMode}
            className={`px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
              isStepMode ? "bg-purple-500 text-white" : "text-text-muted hover:text-text border border-border"
            } disabled:opacity-30`}>
            Paso
          </button>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg">
          {isRunning && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
          <span className="font-bold text-xs text-text-muted">{blocks.length}</span>
          <span className="text-[11px] text-text-muted/50">bloques</span>
        </div>

        <button onClick={submitRobotSimulation}
          disabled={simulationLoading || !getAuthState().isAuthenticated || blocks.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-primary/30 text-primary hover:bg-primary/10 rounded-xl disabled:opacity-30 active:scale-95"
          title={!getAuthState().isAuthenticated ? "Inicia sesion para guardar" : ""}>
          {simulationLoading ? <span className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            : <BsSaveFill className="text-sm" />}
          {simulationLoading ? "..." : "Registrar"}
        </button>
      </div>

      {/* ====== OVERLAYS ====== */}
      <MermaidViewer isOpen={showMermaid} onClose={() => setShowMermaid(false)} />

      {levelComplete && currentLevel && (
        <VictoryOverlay levelName={currentLevel.name} stars={levelStars} score={score}
          blocksUsed={blocks.length} maxBlocks={currentLevel.maxBlocks || 10}
          hasNextLevel={!!getNextLevelId(currentLevel.id!)}
          onNextLevel={() => { const n = getNextLevelId(currentLevel.id!); dismissLevelComplete(); if (n) setLevel(n); }}
          onRetry={() => { dismissLevelComplete(); setLevel(currentLevel.id!); }}
          onExit={() => { dismissLevelComplete(); setLevel(null); }} />
      )}

      {showTutorial && (
        <TutorialOverlay
          onComplete={() => { setShowTutorial(false); localStorage.setItem("pipre_player_progress", JSON.stringify({ ...JSON.parse(localStorage.getItem("pipre_player_progress") || "{}"), tutorialCompleted: true })); }}
          onSkip={() => { setShowTutorial(false); localStorage.setItem("pipre_player_progress", JSON.stringify({ ...JSON.parse(localStorage.getItem("pipre_player_progress") || "{}"), tutorialCompleted: true })); }}
          setLeftTab={() => setLeftDrawerOpen(true)}
          setRightTab={() => setRightDrawerOpen(true)} />
      )}

      {isTransitioning && (
        <div className="fixed inset-0 z-[9998] bg-black pointer-events-none animate-fade-in-soft" style={{ animationDuration: "0.4s" }} />
      )}
    </div>
  );
};

export const Simulador = () => (
  <SimuladorProvider>
    <SimuladorInner />
  </SimuladorProvider>
);
