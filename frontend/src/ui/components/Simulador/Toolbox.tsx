import React, { useState } from "react";
import { useSimulador } from "../../../application/context/SimuladorProvider";
import type { BlockCategory, BlockDefinition } from "../../../shared/types/Simulador";
import { ENVIRONMENT_CONFIGS } from "../../../shared/constants/environmentConfigs";
import {
  BsArrowRepeat,
  BsLockFill,
  BsPlayCircleFill,
  BsChevronDown,
  BsLightningFill,
  BsQuestionCircleFill,
  BsArrowRightCircleFill,
} from "react-icons/bs";

const CATEGORY_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; color: string; bgClass: string }> = {
  event: { label: "Eventos", icon: BsPlayCircleFill, color: "#22c55e", bgClass: "bg-green-500/10" },
  action: { label: "Acciones", icon: BsArrowRightCircleFill, color: "#94a3b8", bgClass: "bg-slate-400/10" },
  condition: { label: "Condiciones", icon: BsQuestionCircleFill, color: "#818cf8", bgClass: "bg-indigo-400/10" },
  loop: { label: "Bucles", icon: BsArrowRepeat, color: "#f97316", bgClass: "bg-orange-500/10" },
  variable: { label: "Variables", icon: BsArrowRepeat, color: "#22c55e", bgClass: "bg-green-500/10" },
};

const CATEGORY_ORDER = ["event", "action", "condition", "loop", "variable"] as BlockCategory[];

export const Toolbox = () => {
  const { installedHardware, environment } = useSimulador();
  const config = ENVIRONMENT_CONFIGS[environment];
  const [paramSelections, setParamSelections] = useState<Record<string, Record<string, string>>>({});
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  if (!config) {
    return (
      <div className="bg-surface flex flex-col h-full rounded-l-lg">
        <div className="p-3 border-b border-border bg-surface-brighter sticky top-0 rounded-tl-lg">
          <h3 className="font-semibold text-text-muted text-xs tracking-wider uppercase">
            Bloques
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-text-muted">Entorno no disponible</p>
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

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const blocksByCategory: Record<string, BlockDefinition[]> = {};
  config.blocks.forEach((b) => {
    if (!blocksByCategory[b.category]) blocksByCategory[b.category] = [];
    blocksByCategory[b.category].push(b);
  });

  return (
    <div className="bg-surface flex flex-col h-full rounded-l-lg">
      <div className="p-3 border-b border-border bg-surface-brighter sticky top-0 z-10 rounded-tl-lg">
        <h3 className="font-bold text-text text-sm tracking-wide">
          Bloques
        </h3>
        <p className="text-[11px] text-text-muted/60 mt-0.5">{config.name}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {CATEGORY_ORDER.map((cat) => {
          const catBlocks = blocksByCategory[cat];
          if (!catBlocks || catBlocks.length === 0) return null;
          const meta = CATEGORY_META[cat];
          const Icon = meta.icon;
          const collapsed = collapsedCategories[cat] || false;

          return (
            <div key={cat} className="mb-1">
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-surface-brighter transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: `${meta.color}20` }}
                  >
                    <Icon className="text-sm" style={{ color: meta.color }} />
                  </div>
                  <span className="font-semibold text-xs" style={{ color: meta.color }}>
                    {meta.label}
                  </span>
                  <span className="text-[10px] text-text-muted/50 font-mono">
                    {catBlocks.length}
                  </span>
                </div>
                <BsChevronDown
                  className="text-[10px] text-text-muted transition-transform"
                  style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
                />
              </button>

              {!collapsed && (
                <div className="space-y-1 pl-7 mt-1">
                  {catBlocks.map((bd) => {
                    const unlocked = isBlockUnlocked(bd.hardwareRequired);
                    const params = getBlockParams(bd);
                    const label = getBlockLabel(bd);
                    const hasOptions = bd.paramOptions && Object.keys(bd.paramOptions).length > 0;

                    return (
                      <div
                        key={bd.type}
                        draggable={unlocked}
                        onDragStart={(e) => onDragStart(e, bd.type, bd.category, params)}
                        className={`group relative px-3 py-2 rounded-xl border cursor-grab transition-all duration-150 select-none ${
                          unlocked
                            ? "hover:scale-[1.02] hover:-translate-y-0.5 active:scale-95"
                            : "opacity-50 cursor-not-allowed"
                        }`}
                        style={{
                          borderColor: `${meta.color}40`,
                          backgroundColor: unlocked ? "var(--surface-brighter)" : "var(--surface)",
                          boxShadow: unlocked
                            ? `0 2px 6px ${meta.color}15, 0 1px 2px rgba(0,0,0,0.05)`
                            : "none",
                        }}
                      >
                        {/* Left color accent */}
                        <div
                          className="absolute left-0 top-1 bottom-1 w-1 rounded-full"
                          style={{ backgroundColor: meta.color }}
                        />

                        {/* Drag handle dots */}
                        {unlocked && (
                          <div className="absolute right-2 top-2 flex gap-0.5 opacity-0 group-hover:opacity-40 transition-opacity">
                            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: meta.color }} />
                            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: meta.color }} />
                            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: meta.color }} />
                          </div>
                        )}

                        <div className="flex items-center justify-between relative">
                          <div className="flex items-center gap-2 min-w-0">
                            <BsLightningFill
                              className="text-[10px] shrink-0"
                              style={{ color: meta.color }}
                            />
                            <span className="text-text font-medium text-[11px] truncate">
                              {label}
                            </span>
                          </div>
                          {!unlocked && (
                            <BsLockFill className="text-xs text-red-400 shrink-0 ml-1" />
                          )}
                        </div>

                        {!unlocked && bd.hardwareRequired && (
                          <p className="text-[10px] text-red-400/70 mt-1 pl-1">
                            Necesita: {bd.hardwareRequired}
                          </p>
                        )}

                        {hasOptions && unlocked && bd.paramOptions && (
                          <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
                            {Object.entries(bd.paramOptions).map(([paramName, options]) => (
                              <select
                                key={paramName}
                                value={params[paramName] || bd.params?.[paramName] || ""}
                                onChange={(e) => updateParam(bd.type, paramName, e.target.value)}
                                className="w-full text-[11px] p-1.5 bg-bg border border-border text-text rounded-lg focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
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
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
