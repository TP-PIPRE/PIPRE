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
import {
  BsCrosshair,
  BsRocketFill,
  BsGrid3X3GapFill,
  BsSpeedometer2
} from "react-icons/bs";

const ENGINE_CLASSES: Record<string, new () => ISimulatorEngine> = {
  battle: BattleStageEngine,
  space: SpaceStageEngine,
  maze: MazeStageEngine,
  obstacle: RaceStageEngine,
};

const ENV_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  battle: BsCrosshair,
  space: BsRocketFill,
  maze: BsGrid3X3GapFill,
  obstacle: BsSpeedometer2,
};

export const Stage3D = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineInstanceRef = useRef<ISimulatorEngine | null>(null);
  const { engineRef, isRunning, installedHardware, currentTheme, environment, energy } =
    useSimulador();

  const config = ENVIRONMENT_CONFIGS[environment];
  const EnvIcon = ENV_ICONS[environment] || BsRocketFill;

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
    <div className="relative w-full h-full bg-bg overflow-hidden border border-border panel-border rounded-lg">
      {/* Kid-friendly HUD */}
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4">
        {/* Top bar */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1 bg-surface/85 backdrop-blur-sm p-2 rounded-lg border border-border/50 shadow-md max-w-[280px]">
            <div className="flex items-center gap-1.5 font-bold text-[10px] text-primary uppercase tracking-wider">
              <EnvIcon className="text-[12px] text-accent animate-pulse" />
              <span>🎮 Mundo: {config?.name || "Aventura"}</span>
            </div>
            <div className="text-[8px] text-text-muted leading-tight font-medium">
              🖱️ Arrastra para mover la cámara • 🔄 Rueda para acercar o alejar
            </div>
          </div>

          <div
            className={`flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border shadow-sm transition-all duration-300 ${
              isRunning
                ? "bg-success/15 border-success text-success animate-pulse"
                : "bg-surface/85 border-border text-text-muted"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isRunning ? "bg-success animate-ping" : "bg-text-muted"
              }`}
            />
            {isRunning ? "🚀 ¡Ejecutando!" : "💤 En espera..."}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex justify-between items-end">
          <div className="bg-surface/85 backdrop-blur-sm p-2 rounded-lg border border-border/50 shadow-md max-w-[250px]">
            <div className="font-bold text-[9px] text-text flex items-center gap-1">
              {isRunning ? (
                <>
                  <span>🔥 ¡Increíble! El robot está en movimiento...</span>
                </>
              ) : (
                <>
                  <span>💡 Tip: ¡Conecta bloques y dale a 'Ejecutar'!</span>
                </>
              )}
            </div>
          </div>
          
          {typeof energy === "number" && (
          <div className="flex flex-col gap-1 items-end bg-surface/85 backdrop-blur-sm p-2 rounded-lg border border-border/50 shadow-md min-w-[180px]">
            <div className="flex items-center justify-between w-full gap-2">
              <span className="font-bold text-[8px] text-text-muted uppercase tracking-wider">🔋 Energía</span>
              <span className="font-mono text-[9px] font-bold" style={{ color: energy > 30 ? "var(--success)" : energy > 10 ? "var(--accent)" : "var(--danger)" }}>
                {Math.round(energy)}%
              </span>
            </div>
            <div className="w-full h-2 bg-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${energy}%`,
                  backgroundColor: energy > 30 ? "var(--success)" : energy > 10 ? "var(--accent)" : "var(--danger)",
                }}
              />
            </div>
          </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
