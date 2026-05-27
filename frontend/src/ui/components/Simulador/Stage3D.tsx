/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef } from "react";
import { useSimulador } from "../../../application/context/SimuladorProvider";
import { BotStageEngine } from "../../../infrastructure/threejs/BotStageEngine";
import { BattleStageEngine } from "../../../infrastructure/threejs/engines/BattleStageEngine";
import { SpaceStageEngine } from "../../../infrastructure/threejs/engines/SpaceStageEngine";
import { MazeStageEngine } from "../../../infrastructure/threejs/engines/MazeStageEngine";
import { RaceStageEngine } from "../../../infrastructure/threejs/engines/RaceStageEngine";
import type { ISimulatorEngine } from "../../../infrastructure/ports/ISimulatorEngine";
import { ENVIRONMENT_CONFIGS } from "../../../shared/constants/environmentConfigs";

const ENGINE_CLASSES: Record<string, new () => ISimulatorEngine> = {
  battle: BattleStageEngine,
  space: SpaceStageEngine,
  maze: MazeStageEngine,
  obstacle: RaceStageEngine,
};

export const Stage3D = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineInstanceRef = useRef<ISimulatorEngine | null>(null);
  const { engineRef, isRunning, installedHardware, currentTheme, environment } =
    useSimulador();

  const config = ENVIRONMENT_CONFIGS[environment];

  useEffect(() => {
    if (!canvasRef.current) return;

    if (engineInstanceRef.current) {
      engineInstanceRef.current.dispose();
      engineInstanceRef.current = null;
    }

    const EngineClass = ENGINE_CLASSES[environment];
    let engine: ISimulatorEngine;

    if (EngineClass) {
      engine = new EngineClass();
    } else {
      engine = new BotStageEngine();
    }

    engine.init(canvasRef.current);
    engine.updateHardware(installedHardware);
    if (currentTheme?.colors) {
      engine.updateTheme(currentTheme.colors);
    }

    engineRef.current = engine;
    engineInstanceRef.current = engine;

    const handleResize = () => {
      if (canvasRef.current) {
        engine.resize(
          canvasRef.current.clientWidth,
          canvasRef.current.clientHeight,
        );
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      engine.dispose();
      engineRef.current = null;
      engineInstanceRef.current = null;
    };
  }, [environment]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateHardware(installedHardware);
    }
  }, [installedHardware]);

  useEffect(() => {
    if (engineRef.current && currentTheme?.colors) {
      engineRef.current.updateTheme(currentTheme.colors);
    }
  }, [currentTheme]);

  return (
    <div className="relative w-full h-full bg-bg overflow-hidden border border-border panel-border">
      {/* Reticle / HUD */}
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1 animate-fade-in">
            <div className="font-mono text-[10px] text-primary uppercase tracking-[0.3em] font-bold">
              Visión Orto 2.5D // {config?.name || "Activa"}
            </div>
            <div className="font-mono text-[9px] text-text-muted uppercase tracking-widest flex gap-4 opacity-70">
              <span>[DRAG] PAN</span>
              <span>[SCROLL] ZOOM</span>
              {config?.icon && (
                <span className="material-symbols-outlined text-[14px]">
                  {config.icon}
                </span>
              )}
            </div>
          </div>
          <div
            className={`font-mono text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 border-2 transition-all duration-500 ${
              isRunning
                ? "border-success text-success shadow-[0_0_15px_var(--theme-success)]"
                : "border-border text-text-muted"
            }`}
          >
            <span
              className={`inline-block w-2 h-2 rounded-full mr-2 ${
                isRunning
                  ? "bg-success animate-pulse"
                  : "bg-text-muted"
              }`}
            ></span>
            {isRunning ? "Ejecutando" : "Standby"}
          </div>
        </div>

        {/* Bottom Telemetry */}
        <div
          className="flex justify-between items-end animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="font-mono text-[9px] text-text-muted/50 max-w-[200px]">
            {"SYS_READY >> LATENCY: 24ms"}
            <br />
            POSITION_SYNC: 100%
          </div>
          <div className="w-32 h-1 bg-primary-low border border-border">
            <div
              className="h-full bg-primary"
              style={{
                width: isRunning ? "100%" : "30%",
                transition: "width 2s ease",
              }}
            ></div>
          </div>
        </div>

        {/* Center Reticle */}
        <div className="absolute inset-0 flex justify-center items-center opacity-10 pointer-events-none">
          <div className="w-80 h-80 border border-border rounded-full flex items-center justify-center">
            <div className="w-64 h-64 border border-dashed border-border rounded-full flex items-center justify-center animate-[spin_60s_linear_infinite]">
              <div className="w-1 h-32 border-l border-primary absolute top-0"></div>
            </div>
            <div className="w-2 h-2 bg-primary rounded-full"></div>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
