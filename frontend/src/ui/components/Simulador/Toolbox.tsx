import React from "react";
import { useSimulador } from "../../../application/context/SimuladorProvider";
import type { BlockCategory } from "../../../shared/types/Simulador";

export const Toolbox = () => {
  const { installedHardware } = useSimulador();

  const hasRuedas = installedHardware.includes("Tracción Oruga");
  const hasHelices = installedHardware.includes("Hélices Cuádruples");
  const hasGarra = installedHardware.includes("Brazo Robótico");
  const hasSonar = installedHardware.includes("Sensor Ultrasónico");
  const hasLed = installedHardware.includes("Faro LED");

  const onDragStart = (
    e: React.DragEvent,
    type: string,
    category: BlockCategory,
    params: Record<string, string>,
  ) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ type, category, params }),
    );
    e.dataTransfer.effectAllowed = "copy";
  };

  const renderBlock = (
    type: string,
    label: string,
    category: BlockCategory,
    isUnlocked: boolean,
    reqText: string,
    colorClass: string,
    params: Record<string, string> = {},
  ) => {
    const getColorClass = () => {
      if (category === "event") return "border-success";
      if (category === "action") return "border-text-muted/50";
      if (category === "condition") return "border-primary";
      return "border-text-muted";
    };

    const getBgColorClass = () => {
      if (category === "event")
        return isUnlocked ? "bg-surface/80" : "bg-surface/30";
      if (category === "action")
        return isUnlocked ? "bg-surface/80" : "bg-surface/30";
      if (category === "condition")
        return isUnlocked ? "bg-surface/80" : "bg-surface/30";
      return isUnlocked ? "bg-surface/80" : "bg-surface/30";
    };

    return (
      <div
        draggable={isUnlocked}
        onDragStart={(e) => onDragStart(e, type, category, params)}
        className={`p-3 border-l-4 ${getColorClass()} ${getBgColorClass()} transition-colors relative overflow-hidden rounded-lg ${
          isUnlocked
            ? "cursor-grab hover:bg-surface/90"
            : "opacity-50 cursor-not-allowed"
        }`}
      >
        {!isUnlocked && (
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8cGF0aCBkPSJNMCAwTDggOFoiIHN0cm9rZT0iIzExMSIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg==')] opacity-20 pointer-events-none"></div>
        )}
        <div className="flex items-center justify-between relative z-10">
          <span className="text-text font-mono text-xs">{label}</span>
          {!isUnlocked && (
            <span className="material-symbols-outlined text-[14px] text-danger">
              lock
            </span>
          )}
        </div>
        {!isUnlocked && (
          <p className="text-[9px] text-danger/80 font-mono mt-1 relative z-10">
            Req: {reqText}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-surface border-r border-border flex flex-col h-full rounded-l-lg">
      <div className="p-4 border-b border-border bg-surface-brighter sticky top-0 rounded-tl-lg">
        <h3 className="font-mono text-text-muted text-xs tracking-[0.15em] uppercase">
          Librería de Bloques
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
        {/* Eventos */}
        <div className="space-y-3">
          <h4 className="font-mono text-success text-[10px] tracking-widest uppercase flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-sm"></div>
            Eventos
          </h4>
          {renderBlock(
            "al_iniciar_sistema",
            "AL_INICIAR_SISTEMA",
            "event",
            true,
            "",
            "border-success",
          )}
          {renderBlock(
            "al_detectar_obstaculo",
            "AL_DETECTAR_OBSTACULO",
            "event",
            hasSonar,
            "Sensor Ultrasónico",
            "border-success",
          )}
        </div>

        {/* Acciones Terrestres */}
        <div className="space-y-3">
          <h4 className="font-mono text-text-muted text-[10px] tracking-widest uppercase flex items-center gap-2">
            <div className="w-2 h-2 bg-text-muted rounded-sm"></div>
            Navegación
          </h4>
          {renderBlock(
            "mover_ruedas",
            "MOVER_RUEDAS(30)",
            "action",
            hasRuedas,
            "Tracción Oruga",
            "border-text-muted/50",
            { distancia: "30" },
          )}
          {renderBlock(
            "rotar_nucleo",
            "ROTAR_NUCLEO(90)",
            "action",
            hasRuedas,
            "Tracción Oruga",
            "border-text-muted/50",
            { grados: "90" },
          )}
          {renderBlock(
            "elevarse",
            "ELEVARSE(50)",
            "action",
            hasHelices,
            "Hélices Drone",
            "border-primary",
            { altura: "50" },
          )}
          {renderBlock(
            "aterrizar",
            "ATERRIZAR()",
            "action",
            hasHelices,
            "Hélices Drone",
            "border-primary",
          )}
        </div>

        {/* Manipulación y Utilidades */}
        <div className="space-y-3">
          <h4 className="font-mono text-accent text-[10px] tracking-widest uppercase flex items-center gap-2">
            <div className="w-2 h-2 bg-accent rounded-sm"></div>
            Interacción
          </h4>
          {renderBlock(
            "agarrar",
            "AGARRAR_OBJETO()",
            "action",
            hasGarra,
            "Garra Mecánica",
            "border-accent",
          )}
          {renderBlock(
            "soltar",
            "SOLTAR_OBJETO()",
            "action",
            hasGarra,
            "Garra Mecánica",
            "border-accent",
          )}
          {renderBlock(
            "encender_luz",
            "ENCENDER_LUZ()",
            "action",
            hasLed,
            "Faro LED",
            "border-accent",
          )}
        </div>

        {/* Condiciones */}
        <div className="space-y-3">
          <h4 className="font-mono text-primary text-[10px] tracking-widest uppercase flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-sm"></div>
            Condiciones
          </h4>
          {renderBlock(
            "si_distancia",
            "SI (distancia < 10)",
            "condition",
            hasSonar,
            "Sensor Ultrasónico",
            "border-primary",
          )}
        </div>
      </div>
    </div>
  );
};
