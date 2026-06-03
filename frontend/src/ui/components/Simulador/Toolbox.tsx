import React from "react";
import { useSimulador } from "../../../application/context/SimuladorProvider";
import type { BlockCategory } from "../../../shared/types/Simulador";
import { ENVIRONMENT_CONFIGS } from "../../../shared/constants/environmentConfigs";

export const Toolbox = () => {
  const { installedHardware, environment } = useSimulador();
  const config = ENVIRONMENT_CONFIGS[environment];

  if (!config) {
    return (
      <div className="bg-surface border-r border-border flex flex-col h-full rounded-l-lg">
        <div className="p-4 border-b border-border bg-surface-brighter sticky top-0 rounded-tl-lg">
          <h3 className="font-mono text-text-muted text-xs tracking-[0.15em] uppercase">
            Librería de Bloques
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="font-mono text-[10px] text-text-muted">Entorno no disponible</p>
        </div>
      </div>
    );
  }

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

  const isBlockUnlocked = (hardwareRequired?: string): boolean => {
    if (!hardwareRequired) return true;
    return installedHardware.includes(hardwareRequired);
  };

  const renderBlock = (
    type: string,
    label: string,
    category: BlockCategory,
    isUnlocked: boolean,
    reqText: string,
    params: Record<string, string> = {},
  ) => {
    const getColorClass = () => {
      if (category === "event") return "border-success";
      if (category === "action") return "border-text-muted/50";
      if (category === "condition") return "border-primary";
      return "border-text-muted";
    };

    return (
      <div
        draggable={isUnlocked}
        onDragStart={(e) => onDragStart(e, type, category, params)}
        className={`p-3 border-l-4 ${getColorClass()} transition-colors relative overflow-hidden rounded-lg ${
          isUnlocked
            ? "cursor-grab hover:bg-surface/90"
            : "opacity-50 cursor-not-allowed"
        }`}
        style={{
          backgroundColor: isUnlocked ? "var(--surface)" : "var(--surface)",
        }}
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

  const events = config.blocks.filter((b) => b.category === "event");
  const actions = config.blocks.filter((b) => b.category === "action");
  const conditions = config.blocks.filter((b) => b.category === "condition");

  return (
    <div className="bg-surface border-r border-border flex flex-col h-full rounded-l-lg">
      <div className="p-4 border-b border-border bg-surface-brighter sticky top-0 rounded-tl-lg">
        <h3 className="font-mono text-text-muted text-xs tracking-[0.15em] uppercase">
          Librería de Bloques
        </h3>
        <p className="text-[9px] text-text-muted/50 mt-1">{config.name}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
        {/* Eventos */}
        {events.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-mono text-success text-[10px] tracking-widest uppercase flex items-center gap-2">
              <div className="w-2 h-2 bg-success rounded-sm"></div>
              Eventos
            </h4>
            {events.map((bd) => (
              <div key={bd.type}>
                {renderBlock(
                  bd.type,
                  bd.label,
                  bd.category,
                  isBlockUnlocked(bd.hardwareRequired),
                  bd.hardwareRequired || "",
                  bd.params || {},
                )}
              </div>
            ))}
          </div>
        )}

        {/* Acciones */}
        {actions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-mono text-text-muted text-[10px] tracking-widest uppercase flex items-center gap-2">
              <div className="w-2 h-2 bg-text-muted rounded-sm"></div>
              Acciones
            </h4>
            {actions.map((bd) => (
              <div key={bd.type}>
                {renderBlock(
                  bd.type,
                  bd.label,
                  bd.category,
                  isBlockUnlocked(bd.hardwareRequired),
                  bd.hardwareRequired || "",
                  bd.params || {},
                )}
              </div>
            ))}
          </div>
        )}

        {/* Condiciones */}
        {conditions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-mono text-primary text-[10px] tracking-widest uppercase flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-sm"></div>
              Condiciones
            </h4>
            {conditions.map((bd) => (
              <div key={bd.type}>
                {renderBlock(
                  bd.type,
                  bd.label,
                  bd.category,
                  isBlockUnlocked(bd.hardwareRequired),
                  bd.hardwareRequired || "",
                  bd.params || {},
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
