/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SimuladorProvider, useSimulador } from "../../application/context/SimuladorProvider";
import { getAuthState } from "../../infrastructure/store/authStore";
import { HardwarePanel } from "../components/Simulador/HardwarePanel";
import { Toolbox } from "../components/Simulador/Toolbox";
import { Workspace } from "../components/Simulador/Workspace";
import { Stage3D } from "../components/Simulador/Stage3D";
import { Console } from "../components/Simulador/Console";
import { MissionsPanel } from "../components/Simulador/MissionsPanel";
import { MissionCanvas } from "../components/Simulador/MissionCanvas";
import { TabBar } from "../components/Simulador/TabBar";
import { FloatingWorkspace } from "../components/Simulador/FloatingWorkspace";
import { SimulatorLayout } from "../components/Simulador/SimulatorLayout";
import { MermaidViewer } from "../components/Simulador/MermaidViewer";
import { NavigationModeDetector } from "../../application/adapters/NavigationModeDetector";
import { ChallengeAdapter, type AdaptedChallenge } from "../../application/adapters/ChallengeAdapter";
import { ENVIRONMENT_CONFIGS } from "../../shared/constants/environmentConfigs";
import type { EnvironmentType } from "../../shared/types/Simulador";
import {
  BsRocketFill,
  BsGearFill,
  BsCode,
  BsMapFill,
  BsPlayFill,
  BsStopFill,
  BsTrashFill,
  BsSaveFill,
   
  BsTrophyFill,
  BsStarFill,
  BsArrowLeft,
  BsList,
  BsCrosshair,
  BsGrid3X3GapFill,
  BsSpeedometer2,
  BsDiagram3Fill
} from "react-icons/bs";

const ENVIRONMENTS: { id: EnvironmentType; Icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { id: "battle", Icon: BsCrosshair, color: "#ef4444" },
  { id: "space", Icon: BsRocketFill, color: "#3b82f6" },
  { id: "maze", Icon: BsGrid3X3GapFill, color: "#8b5cf6" },
  { id: "obstacle", Icon: BsSpeedometer2, color: "#f97316" },
];

const EnvironmentSelector = () => {
  const { environment, setEnvironment, isFreeMode } = useSimulador();

  if (!isFreeMode) return null;

  return (
    <div
      className="flex gap-2 px-4 py-3 border-b border-border items-center"
      style={{ backgroundColor: "var(--surface)" }}
    >
      <span className="font-mono text-[10px] text-text-muted uppercase tracking-widest mr-2 self-center">
        Mapa:
      </span>
      {ENVIRONMENTS.map((env) => {
        const config = ENVIRONMENT_CONFIGS[env.id];
        const isActive = environment === env.id;
        const Icon = env.Icon;
        return (
          <button
            key={env.id}
            onClick={() => setEnvironment(env.id)}
            className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all border rounded-lg ${
              isActive
                ? "text-white shadow-[0_0_12px_rgba(0,0,0,0.3)] scale-[1.02]"
                : "bg-surface-brighter text-text-muted border-border hover:border-primary/30 hover:text-text"
            }`}
            style={{
              backgroundColor: isActive ? env.color : undefined,
              borderColor: isActive ? env.color : undefined,
            }}
          >
            <Icon className="text-[14px]" />
            <div className="flex flex-col items-start leading-tight">
              <span>{config?.name || env.id}</span>
              {config?.hardware && (
                <span className="text-[7px] opacity-70 font-normal tracking-normal">
                  {Object.keys(config.hardware).length} hardware
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

const ChallengeInfoBar = ({ challenge }: { challenge: AdaptedChallenge }) => {
  return (
    <div
      className="flex items-center justify-between px-4 py-2 border-b border-border"
      style={{ backgroundColor: "var(--surface-brighter)" }}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <BsTrophyFill className="text-[12px] text-accent" />
          <span className="font-mono text-[10px] text-text font-semibold">
            {challenge.title}
          </span>
        </div>
        <span className="text-text-muted/30">|</span>
        <div className="flex items-center gap-2">
          <BsStarFill className="text-[10px] text-primary" />
          <span className="font-mono text-[9px] text-text-muted">
            {challenge.points} pts
          </span>
        </div>
        <span className="text-text-muted/30">|</span>
        <span
          className={`font-mono text-[9px] px-2 py-0.5 rounded-full ${
            challenge.difficulty === "EASY"
              ? "bg-success/20 text-success"
              : challenge.difficulty === "MEDIUM"
              ? "bg-accent/20 text-accent"
              : "bg-danger/20 text-danger"
          }`}
        >
          {challenge.difficulty}
        </span>
        <span className="text-text-muted/30">|</span>
        <span className="font-mono text-[9px] text-text-muted">
          Máx {challenge.maxBlocks} bloques
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-mono text-[9px] text-text-muted">
          Entorno: {ENVIRONMENT_CONFIGS[challenge.environment]?.name || challenge.environment}
        </span>
      </div>
    </div>
  );
};

const SimuladorInner = () => {
  const { courseId } = useParams<{ courseId?: string }>();
  const navigate = useNavigate();
  const {
    loadChallengeFromCourse,
    isFreeMode,
    setFreeMode,
    challenges,
    selectChallenge,
    challengeData,
    selectedActivity,
    environment,
    submitRobotSimulation,
    simulationLoading,
    blocks,
    clearWorkspace,
    isRunning,
    executeProgram,
    stopExecution,
    missions,
    score,
    energy,
  } = useSimulador();
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [showChallengeList, setShowChallengeList] = useState(false);
  const [showMermaid, setShowMermaid] = useState(false);
  const [activeLeftTab, setActiveLeftTab] = useState("hardware");
  const [activeRightTab, setActiveRightTab] = useState("missions");

  const navigationMode = useMemo(() => {
    return NavigationModeDetector.detect(challengeData, selectedActivity, environment);
  }, [challengeData, selectedActivity, environment]);

  const adaptedChallenge = useMemo(() => {
    if (challengeData) {
      return ChallengeAdapter.adaptChallenge(challengeData);
    }
    if (selectedActivity) {
      return ChallengeAdapter.adaptActivityResponse(selectedActivity, {
        idActivity: selectedActivity.idActivity,
        name: selectedActivity.name,
        environment: environment,
        difficulty: "EASY",
        logicLevel: 1,
        missions: [],
      });
    }
    return null;
  }, [challengeData, selectedActivity, environment]);

  const visiblePanels = useMemo(() => {
    return NavigationModeDetector.getVisiblePanels(navigationMode);
  }, [navigationMode]);

  const layoutConfig = useMemo(() => {
    return NavigationModeDetector.getLayoutConfig(navigationMode);
  }, [navigationMode]);

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

  const leftPanelTabs = [
    { id: "hardware", label: "Hardware", icon: <BsGearFill className="text-[10px]" /> },
    { id: "blocks", label: "Bloques", icon: <BsCode className="text-[10px]" /> },
  ];

  const rightPanelTabs = [
    {
      id: "missions",
      label: "Misiones",
      icon: <BsMapFill className="text-[10px]" />,
      badge: missions.filter((m) => !m.isCompleted).length,
    },
    ...(visiblePanels.showCanvas ? [{
      id: "canvas",
      label: "Mapa",
      icon: <BsRocketFill className="text-[10px]" />,
    }] : []),
  ];

  const leftPanelContent = () => {
    switch (activeLeftTab) {
      case "hardware":
        return <HardwarePanel />;
      case "blocks":
        return <Toolbox />;
      default:
        return <HardwarePanel />;
    }
  };

  const rightPanelContent = () => {
    switch (activeRightTab) {
      case "missions":
        return <MissionsPanel />;
      case "canvas":
        return <MissionCanvas />;
      default:
        return <MissionsPanel />;
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      <h1 className="sr-only">Simulador</h1>

      {navigationMode.mode === "playground" && <EnvironmentSelector />}
      {navigationMode.mode === "challenge" && adaptedChallenge && (
        <ChallengeInfoBar challenge={adaptedChallenge} />
      )}

      {navigationMode.mode === "challenge" && !isFreeMode && (
        <div
          className="flex items-center justify-between px-4 py-2 border-b border-border"
          style={{ backgroundColor: "var(--surface-brighter)" }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToCourses}
              className="font-mono text-[10px] text-text-muted hover:text-primary transition-colors flex items-center gap-1"
            >
              <BsArrowLeft className="text-[14px]" />
              Cursos
            </button>
            <span className="text-text-muted/30">|</span>
            <span className="font-mono text-[10px] text-text-muted uppercase tracking-widest">
              Modo Reto
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
                <BsList className="text-[14px]" />
                Cambiar Reto
              </button>
              {showChallengeList && (
                <div
                  className="absolute right-0 top-full mt-1 z-50 border border-border rounded-lg shadow-xl"
                  style={{
                    backgroundColor: "var(--surface)",
                    minWidth: "200px",
                  }}
                >
                  {challenges.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => {
                        selectChallenge(ch);
                        setShowChallengeList(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-[9px] font-mono hover:bg-surface-brighter transition-colors border-b border-border last:border-b-0 ${
                        challengeData?.id === ch.id
                          ? "text-primary font-bold"
                          : "text-text"
                      }`}
                    >
                      <div>{ch.title}</div>
                      <div className="text-[9px] text-text-muted">
                        {ch.difficulty} • {ch.points} pts
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <main className="flex-1 p-2 overflow-hidden relative min-h-0">
        <SimulatorLayout
          leftPanel={{
            visible: visiblePanels.showToolbox,
            defaultWidth: layoutConfig.leftPanelWidth,
            minWidth: 200,
            maxWidth: 400,
            header: "Herramientas",
            children: (
              <TabBar
                tabs={leftPanelTabs}
                activeTab={activeLeftTab}
                onTabChange={setActiveLeftTab}
                variant="compact"
              >
                <div className="h-[calc(100%-40px)] overflow-auto">
                  {leftPanelContent()}
                </div>
              </TabBar>
            ),
          }}
          rightPanel={{
            visible: visiblePanels.showMissions,
            defaultWidth: layoutConfig.rightPanelWidth,
            minWidth: 200,
            maxWidth: 400,
            header: "Misiones",
            children: (
              <TabBar
                tabs={rightPanelTabs}
                activeTab={activeRightTab}
                onTabChange={setActiveRightTab}
                variant="compact"
              >
                <div className="h-[calc(100%-40px)] overflow-auto">
                  {rightPanelContent()}
                </div>
              </TabBar>
            ),
          }}
          centerPanel={
            <div className="h-full flex flex-col">
              <div className="flex-1 min-h-0 flex items-center justify-center p-2">
                <div
                  className="w-full h-full max-w-full max-h-full flex items-center justify-center"
                  style={{ aspectRatio: "16/9" }}
                >
                  <div ref={canvasContainerRef} className="w-full h-full relative">
                    <Stage3D />
                    <FloatingWorkspace
                      title="Ensamblaje Lógico"
                      defaultPosition={{ x: 30, y: 30 }}
                      defaultSize={{ width: 480, height: 320 }}
                      minWidth={300}
                      minHeight={200}
                      zIndex={100}
                      constrainToRef={canvasContainerRef}
                    >
                      <Workspace />
                    </FloatingWorkspace>
                  </div>
                </div>
              </div>
              <div
                className="shrink-0 h-24 border-t border-border"
                style={{ backgroundColor: "var(--surface)" }}
              >
                <Console />
              </div>
            </div>
          }
          toolbar={
            <div className="flex items-center gap-2 px-3 py-2 border-t border-border" style={{ backgroundColor: "var(--surface)" }}>
              <div className="flex gap-1.5">
                <button
                  onClick={isRunning ? stopExecution : executeProgram}
                  disabled={!isRunning && blocks.length === 0}
                  className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-all rounded-md ${
                    isRunning
                      ? "bg-danger text-white hover:bg-danger/80 shadow-lg shadow-danger/20"
                      : "bg-primary text-white hover:bg-primary/80 shadow-lg shadow-primary/20 disabled:opacity-40 disabled:shadow-none"
                  }`}
                >
                  {isRunning ? (
                    <><BsStopFill className="text-[9px]" /> Detener</>
                  ) : (
                    <><BsPlayFill className="text-[9px]" /> Ejecutar</>
                  )}
                </button>
                <button
                  onClick={clearWorkspace}
                  disabled={isRunning || blocks.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-text hover:bg-surface-brighter/50 transition-colors rounded-md disabled:opacity-30"
                >
                  <BsTrashFill className="text-[9px]" /> Limpiar
                </button>
                <button
                  onClick={() => setShowMermaid(true)}
                  disabled={blocks.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-text hover:bg-surface-brighter/50 transition-colors rounded-md disabled:opacity-30"
                >
                  <BsDiagram3Fill className="text-[9px]" /> Diagrama
                </button>
              </div>

              <div className="w-px h-6 bg-border mx-1" />

              {navigationMode.mode === "challenge" && (
                <div className="flex items-center gap-2 px-2 py-1 rounded bg-surface-brighter/30">
                  <BsTrophyFill className="text-[9px] text-[#eab308]" />
                  <span className="font-mono text-[9px] text-[#eab308] font-bold">{score}</span>
                  <span className="font-mono text-[8px] text-text-muted/60">pts</span>
                </div>
              )}

              <div className="flex-1" />

              <div className="flex items-center gap-3">
                {isRunning && (
                  <span className="flex items-center gap-1.5 font-mono text-[9px] text-primary animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Ejecutando...
                  </span>
                )}
                <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ backgroundColor: "var(--bg)" }}>
                  <BsCode className="text-[9px] text-text-muted" />
                  <span className="font-mono text-[9px] text-text-muted font-semibold">{blocks.length}</span>
                  <span className="font-mono text-[8px] text-text-muted/50">bloques</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ backgroundColor: "var(--bg)" }}>
                  <BsSpeedometer2 className="text-[9px] text-text-muted" />
                  <span className="font-mono text-[9px] text-text-muted font-semibold">{Math.round(energy)}</span>
                  <span className="font-mono text-[8px] text-text-muted/50">energía</span>
                </div>
              </div>

              <div className="w-px h-6 bg-border mx-1" />

              <button
                onClick={submitRobotSimulation}
                disabled={simulationLoading || !getAuthState().isAuthenticated || blocks.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider border border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 transition-colors rounded-md disabled:opacity-30"
                title={
                  !getAuthState().isAuthenticated
                    ? "Inicia sesión para guardar avances"
                    : ""
                }
              >
                {simulationLoading ? (
                  <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                ) : (
                  <BsSaveFill className="text-[9px]" />
                )}
                {simulationLoading ? "Guardando..." : "Registrar"}
              </button>
            </div>
          }
        />
      </main>

      <MermaidViewer isOpen={showMermaid} onClose={() => setShowMermaid(false)} />
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
