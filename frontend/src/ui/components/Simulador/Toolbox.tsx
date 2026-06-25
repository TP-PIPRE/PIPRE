import React, { useState } from "react";
import { useSimulador } from "../../../application/context/SimuladorProvider";
import type { BlockCategory, BlockDefinition } from "../../../shared/types/Simulador";
import { ENVIRONMENT_CONFIGS } from "../../../shared/constants/environmentConfigs";
import { BsArrowRepeat, BsLockFill } from "react-icons/bs";

export const Toolbox = () => {
  const { installedHardware, environment } = useSimulador();
  const config = ENVIRONMENT_CONFIGS[environment];
  const [paramSelections, setParamSelections] = useState<Record<string, Record<string, string>>>({});

  if (!config) {
    return (
      <div className="bg-surface border-r border-border flex flex-col h-full rounded-l-lg">
        <div className="p-4 border-b border-border bg-surface-brighter sticky top-0 rounded-tl-lg">
          <h3 className="font-mono text-text-muted text-[10px] tracking-[0.15em] uppercase">
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

  const updateParam = (blockType: string, paramName: string, value: string) => {
    setParamSelections((prev) => ({
      ...prev,
      [blockType]: { ...(prev[blockType] || {}), [paramName]: value },
    }));
  };

  const getBlockParams = (bd: BlockDefinition) => {
    const selections = paramSelections[bd.type] || {};
    const merged = { ...(bd.params || {}) };
    for (const key of Object.keys(selections)) {
      if (selections[key]) merged[key] = selections[key];
    }
    return merged;
  };

  const getBlockLabel = (bd: BlockDefinition) => {
    const selections = paramSelections[bd.type] || {};
    const paramOptions = bd.paramOptions;
    if (paramOptions) {
      for (const [paramName, options] of Object.entries(paramOptions)) {
        const selectedValue = selections[paramName] || bd.params?.[paramName];
        if (selectedValue) {
          const opt = options.find((o) => o.value === selectedValue);
          if (opt) {
            const base = bd.label.replace(/\(.*?\)/, "");
            return `${base}(${opt.label})`;
          }
        }
      }
    }
    return bd.label;
  };

  const renderBlock = (bd: BlockDefinition, isUnlocked: boolean) => {
    const getColorClass = () => {
      if (bd.category === "event") return "border-success";
      if (bd.category === "action") return "border-text-muted/50";
      if (bd.category === "condition") return "border-primary";
      if (bd.category === "loop") return "border-accent";
      return "border-text-muted";
    };

    const getIcon = () => {
      if (bd.category === "loop") return "repeat";
      return null;
    };

    const params = getBlockParams(bd);
    const label = getBlockLabel(bd);
    const hasOptions = bd.paramOptions && Object.keys(bd.paramOptions).length > 0;
    const icon = getIcon();

    return (
      <div
        draggable={isUnlocked}
        onDragStart={(e) => onDragStart(e, bd.type, bd.category, params)}
        className={`p-3 border-l-4 ${getColorClass()} transition-colors relative overflow-hidden ${
          isUnlocked
            ? "cursor-grab hover:bg-surface/90"
            : "opacity-50 cursor-not-allowed"
        }`}
        style={{
          backgroundColor: isUnlocked ? "var(--surface)" : "var(--surface)",
          borderRadius: "var(--theme-radius)",
        }}
      >
        {!isUnlocked && (
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8cGF0aCBkPSJNMCAwTDggOFoiIHN0cm9rZT0iIzExMSIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg==')] opacity-20 pointer-events-none"></div>
        )}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            {icon && (
              <BsArrowRepeat className="text-[14px] text-accent" />
            )}
            <span className="text-text font-mono text-[10px]">{label}</span>
          </div>
          {!isUnlocked && (
            <BsLockFill className="text-[14px] text-danger" />
          )}
        </div>
        {hasOptions && isUnlocked && bd.paramOptions && (
          <div className="mt-2 relative z-10" onClick={(e) => e.stopPropagation()}>
            {Object.entries(bd.paramOptions).map(([paramName, options]) => (
              <select
                key={paramName}
                value={params[paramName] || bd.params?.[paramName] || ""}
                onChange={(e) => updateParam(bd.type, paramName, e.target.value)}
                className="w-full text-[9px] p-1.5 bg-bg border border-border text-text focus:outline-none focus:border-primary"
                style={{ borderRadius: "var(--theme-radius)" }}
                onDragStart={(e) => e.stopPropagation()}
              >
                {options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ))}
          </div>
        )}
        {!isUnlocked && (
          <p className="text-[9px] text-danger/80 font-mono mt-1 relative z-10">
            Req: {bd.hardwareRequired || ""}
          </p>
        )}
      </div>
    );
  };

  const events = config.blocks.filter((b) => b.category === "event");
  const actions = config.blocks.filter((b) => b.category === "action");
  const conditions = config.blocks.filter((b) => b.category === "condition");
  const loops = config.blocks.filter((b) => b.category === "loop");

  return (
    <div className="bg-surface border-r border-border flex flex-col h-full rounded-l-lg">
      <div className="p-4 border-b border-border bg-surface-brighter sticky top-0 rounded-tl-lg">
        <h3 className="font-mono text-text-muted text-[10px] tracking-[0.15em] uppercase">
          Librería de Bloques
        </h3>
        <p className="text-[9px] text-text-muted/50 mt-1">{config.name}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
        {events.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-mono text-success text-[8px] tracking-widest uppercase flex items-center gap-2">
              <div className="w-2 h-2 bg-success rounded-sm"></div>
              Eventos
            </h4>
            {events.map((bd) => (
              <div key={bd.type}>{renderBlock(bd, isBlockUnlocked(bd.hardwareRequired))}</div>
            ))}
          </div>
        )}

        {actions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-mono text-text-muted text-[8px] tracking-widest uppercase flex items-center gap-2">
              <div className="w-2 h-2 bg-text-muted rounded-sm"></div>
              Acciones
            </h4>
            {actions.map((bd) => (
              <div key={bd.type}>{renderBlock(bd, isBlockUnlocked(bd.hardwareRequired))}</div>
            ))}
          </div>
        )}

        {conditions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-mono text-primary text-[8px] tracking-widest uppercase flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-sm"></div>
              Condiciones
            </h4>
            {conditions.map((bd) => (
              <div key={bd.type}>{renderBlock(bd, isBlockUnlocked(bd.hardwareRequired))}</div>
            ))}
          </div>
        )}

        {loops.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-mono text-accent text-[8px] tracking-widest uppercase flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-sm"></div>
              Bucles
            </h4>
            {loops.map((bd) => (
              <div key={bd.type}>{renderBlock(bd, isBlockUnlocked(bd.hardwareRequired))}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
