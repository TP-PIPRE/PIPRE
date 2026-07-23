import React, { useCallback } from "react";
import { useSimulador } from "../../../application/context/SimuladorProvider";
import type { Block, BlockCategory } from "../../../shared/types/Simulador";
import { ENVIRONMENT_CONFIGS } from "../../../shared/constants/environmentConfigs";
import { ENERGY_COST } from "../../../shared/constants/energyCosts";
import { LoopBlockRenderer } from "./LoopBlockRenderer";
import {
  BsPlayCircleFill,
  BsArrowRight,
  BsCheckCircleFill,
  BsArrowRepeat,
  BsGridFill,
  BsXLg,
  BsBraces,
  BsLightningFill,
  BsExclamationTriangleFill,
  BsHash,
} from "react-icons/bs";

const CATEGORY_COLORS: Record<BlockCategory, string> = {
  event: "#22c55e",
  action: "#94a3b8",
  condition: "#818cf8",
  loop: "#f97316",
  variable: "#22c55e",
};

const CATEGORY_ICONS: Record<BlockCategory, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  event: BsPlayCircleFill,
  action: BsArrowRight,
  condition: BsCheckCircleFill,
  loop: BsArrowRepeat,
  variable: BsHash,
};

export const Workspace = () => {
  const {
    blocks,
    addBlock,
    removeBlock,
    updateBlockParam,
    environment,
    addChildBlock,
    removeChildBlock,
    currentBlockId,
    blockError,
    clearBlockError,
    installedHardware,
    engineRef,
  } = useSimulador();
  const config = ENVIRONMENT_CONFIGS[environment];

  const calculatePathPreview = useCallback(
    (hoveredBlock: Block): Array<{ x: number; z: number; y?: number }> => {
      const engine = engineRef.current;
      if (!engine?.getBotPosition) return [];

      const { x, z, rotation } = engine.getBotPosition();
      const waypoints: Array<{ x: number; z: number; y?: number }> = [{ x, z }];

      let currentX = x;
      let currentZ = z;
      let currentRot = rotation;

      for (const block of blocks) {
        if (
          block.type === "mover_ruedas" ||
          block.type === "avanzar" ||
          block.type === "desplazarse"
        ) {
          const dist = parseFloat(block.params.distancia || "30") / 10;
          currentX += Math.sin(currentRot) * dist;
          currentZ -= Math.cos(currentRot) * dist;
          waypoints.push({ x: currentX, z: currentZ });
        }

        if (block.type === "rotar_nucleo" || block.type === "girar") {
          const angle = parseFloat(block.params.grados || "90");
          currentRot += (angle * Math.PI) / 180;
        }

        if (block === hoveredBlock) break;
      }

      return waypoints;
    },
    [blocks, engineRef]
  );

  const handleBlockHover = useCallback(
    (block: Block, isEnter: boolean) => {
      const engine = engineRef.current;
      if (!engine) return;

      if (!isEnter) {
        engine.clearPreview?.();
        return;
      }

      if (
        block.type === "mover_ruedas" ||
        block.type === "avanzar" ||
        block.type === "desplazarse"
      ) {
        const waypoints = calculatePathPreview(block);
        if (waypoints.length >= 2) {
          engine.showPathPreview?.(waypoints);
        }
      } else if (block.type === "rotar_nucleo" || block.type === "girar") {
        const angle = parseFloat(block.params.grados || "90");
        engine.showRotationPreview?.(angle);
      }
    },
    [calculatePathPreview, engineRef]
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData("application/json");
    if (!dataStr) return;
    try {
      const data = JSON.parse(dataStr);
      addBlock(data.type, data.category, data.params);
    } catch (err) {
      console.error(err);
    }
  };

  const renderCategoryIcon = (category: BlockCategory, className?: string) => {
    const Icon = CATEGORY_ICONS[category] || BsGridFill;
    const color = CATEGORY_COLORS[category] || "#64748b";
    return <Icon className={className} style={{ color }} />;
  };

  const getBlockDef = (type: string) => config?.blocks.find((b) => b.type === type);
  const getBlockLabel = (type: string, params: Record<string, string>) => {
    const def = getBlockDef(type);
    if (!def) return type.toUpperCase();
    const opts = def.paramOptions;
    let suffix = "";
    if (opts) {
      for (const [pName, options] of Object.entries(opts)) {
        const val = params[pName];
        if (val) {
          const opt = options.find((o) => o.value === val);
          if (opt) suffix = ` (${opt.label})`;
        }
      }
    }
    return `${def.label}${suffix}`;
  };

  const getLoopLabel = (block: Block) => {
    const param = block.params?.iteraciones || block.params?.repeticiones || "3";
    return `REPETIR(${param})`;
  };

  const getAvailableBlocksForLoops = () => {
    if (!config?.blocks) return [];
    return config.blocks
      .filter((b) => b.category === "action")
      .map((b) => ({
        type: b.type,
        label: b.label,
        category: b.category as BlockCategory,
      }));
  };

  const renderBlock = (block: Block, index: number, parentIndex?: string) => {
    const def = getBlockDef(block.type);
    const hasOptions = def?.paramOptions && Object.keys(def.paramOptions).length > 0;
    const isLoop = block.category === "loop";
    const blockNumber = parentIndex ? `${parentIndex}.${index + 1}` : `${index + 1}`;
    const categoryColor = CATEGORY_COLORS[block.category] || "#64748b";
    const hasHardwareError = blockError?.blockId === block.id;

    // Check if this block's hardware is missing
    const hardwareMissing = def?.hardwareRequired && !installedHardware.includes(def.hardwareRequired);
    const showHardwareWarning = hardwareMissing && !isLoop;

    if (isLoop) {
      return (
        <LoopBlockRenderer
          key={block.id}
          block={block}
          label={getLoopLabel(block)}
          color="#f97316"
          onRemove={removeBlock}
          onParamChange={updateBlockParam}
          onAddChild={addChildBlock}
          onRemoveChild={removeChildBlock}
          paramOptions={def?.paramOptions}
          availableBlocks={getAvailableBlocksForLoops()}
          blockNumber={blockNumber}
          isActive={currentBlockId === block.id}
          currentExecutingBlockId={currentBlockId}
        />
      );
    }

    const isBlockActive = currentBlockId === block.id;

    return (
      <div
        key={block.id}
        className={`group relative transition-all duration-200 ${
          isBlockActive ? "z-10" : ""
        } ${hasHardwareError ? "animate-shake" : ""}`}
        onClick={() => hasHardwareError && clearBlockError()}
        onMouseEnter={() => handleBlockHover(block, true)}
        onMouseLeave={() => handleBlockHover(block, false)}
      >
        {/* Puzzle tab at top - visible connection point */}
        <div className="flex justify-center -mb-px">
          <div
            className="w-4 h-1.5 rounded-b-sm"
            style={{
              backgroundColor: isBlockActive ? categoryColor : `${categoryColor}30`,
              opacity: isBlockActive ? 1 : 0.4,
            }}
          />
        </div>

        <div
          className={`flex items-center gap-2.5 px-3 py-2.5 min-w-[200px] transition-all duration-200 rounded-xl ${
            isBlockActive
              ? "ring-2 ring-green-400/50 scale-[1.01] shadow-lg shadow-green-400/10"
              : showHardwareWarning
              ? "ring-1 ring-amber-500/40 bg-amber-500/5 hover:shadow-md"
              : "hover:shadow-md"
          }`}
          style={{
            backgroundColor: isBlockActive
              ? "rgba(34, 197, 94, 0.06)"
              : showHardwareWarning
              ? undefined
              : "var(--surface)",
            borderLeft: `3px solid ${showHardwareWarning ? "#f59e0b" : isBlockActive ? categoryColor : `${categoryColor}60`}`,
            borderTopRightRadius: "12px",
            borderBottomRightRadius: "12px",
            borderRadius: "0 12px 12px 0",
            boxShadow: isBlockActive
              ? `0 0 24px ${categoryColor}20, 0 4px 12px rgba(0,0,0,0.08)`
              : "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          {/* Hardware missing warning icon */}
          {showHardwareWarning && (
            <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm" title={`Requiere: ${def?.hardwareRequired}`}>
              <BsExclamationTriangleFill className="text-[9px]" />
            </div>
          )}

          {/* Block Number */}
          <span
            className="font-mono text-xs font-bold min-w-[28px] shrink-0 text-center"
            style={{ color: showHardwareWarning ? "#f59e0b" : categoryColor }}
          >
            {blockNumber}
          </span>

          {/* Block Icon */}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${showHardwareWarning ? "#f59e0b" : categoryColor}15` }}
          >
            {renderCategoryIcon(block.category, "text-sm")}
          </div>

          {/* Block Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[12px] block truncate" style={{ color: "var(--text)" }}>
                {getBlockLabel(block.type, block.params)}
              </span>
              {ENERGY_COST[block.type] && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-500 font-bold shrink-0 flex items-center gap-0.5">
                  <BsLightningFill className="text-[7px]" />
                  {ENERGY_COST[block.type]}
                </span>
              )}
            </div>

            {showHardwareWarning && def?.hardwareRequired && (
              <p className="text-[10px] text-amber-500/80 mt-1 font-medium">
                Necesita: {def.hardwareRequired}
              </p>
            )}

            {hasOptions && def?.paramOptions && (
              <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
                {Object.entries(def.paramOptions).map(([pName, options]) => (
                  <select
                    key={pName}
                    value={block.params[pName] || def.params?.[pName] || options[0]?.value || ""}
                    onChange={(e) => updateBlockParam(block.id, pName, e.target.value)}
                    className="text-[11px] p-1.5 bg-bg border border-border text-text rounded-lg focus:outline-none focus:border-primary/50 w-full transition-colors"
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

          {/* Delete Button */}
          <button
            onClick={() => removeBlock(block.id)}
            className="opacity-0 group-hover:opacity-100 transition-all p-1.5 hover:bg-red-500/15 rounded-lg shrink-0"
            style={{ color: "var(--text-muted)" }}
            title="Eliminar bloque"
          >
            <BsXLg className="text-sm" />
          </button>
        </div>

        {/* Puzzle socket at bottom */}
        <div className="flex justify-center -mt-px">
          <div
            className="w-4 h-1.5 rounded-t-sm"
            style={{
              backgroundColor: isBlockActive ? categoryColor : `${categoryColor}30`,
              opacity: isBlockActive ? 1 : 0.4,
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "var(--bg)" }}>
      <div
        className="flex-1 overflow-y-auto p-4 relative"
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {/* Dotted Grid Background (like Scratch) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, var(--border) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            opacity: 0.5,
          }}
        />

        {blockError && blockError.blockId.startsWith("new_") && (
          <div className="relative z-20 mb-3 mx-auto max-w-[280px] p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-center animate-shake">
            <BsExclamationTriangleFill className="text-sm text-red-400 mx-auto mb-1" />
            <p className="text-[11px] text-red-400 font-semibold">{blockError.message}</p>
          </div>
        )}

        {blocks.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-[300px] p-5 rounded-2xl border-2 border-dashed border-border bg-surface/50">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-bg shadow-sm border border-border">
                  <BsBraces className="text-2xl text-primary/50" />
                </div>
              </div>

              <h3 className="text-sm font-bold text-text text-center mb-2">
                Sin bloques aun
              </h3>

              <p className="text-[11px] text-text-muted text-center mb-4 leading-relaxed">
                Arrastra bloques desde la izquierda o usa los botones de abajo para empezar a programar tu robot.
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => addBlock("inicio", "event", {})}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-green-500/20 bg-green-500/5 hover:bg-green-500/10 hover:border-green-500/40 transition-all text-left active:scale-[0.98]"
                >
                  <BsPlayCircleFill className="text-sm text-green-500" />
                  <span className="text-xs font-semibold text-text">Agregar INICIO</span>
                </button>

                <button
                  onClick={() => addBlock("repetir", "loop", { iteraciones: "3" })}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10 hover:border-orange-500/40 transition-all text-left active:scale-[0.98]"
                >
                  <BsArrowRepeat className="text-sm text-orange-500" />
                  <span className="text-xs font-semibold text-text">Agregar REPETIR</span>
                </button>

                <button
                  onClick={() => addBlock("avanzar", "action", { distancia: "30" })}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-400/20 bg-slate-400/5 hover:bg-slate-400/10 hover:border-slate-400/40 transition-all text-left active:scale-[0.98]"
                >
                  <BsArrowRight className="text-sm text-slate-400" />
                  <span className="text-xs font-semibold text-text">Agregar AVANZAR</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col gap-0 items-start pb-20">
            {blocks.map((block, index) => renderBlock(block, index))}
          </div>
        )}
      </div>
    </div>
  );
};
