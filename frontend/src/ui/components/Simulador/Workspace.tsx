import React from "react";
import { useSimulador } from "../../../application/context/SimuladorProvider";
import type { Block, BlockCategory } from "../../../shared/types/Simulador";
import { ENVIRONMENT_CONFIGS } from "../../../shared/constants/environmentConfigs";
import { LoopBlockRenderer } from "./LoopBlockRenderer";
import {
  BsPlayCircleFill,
  BsArrowRight,
  BsCheckCircleFill,
  BsArrowRepeat,
  BsGridFill,
  BsXLg,
  BsBraces
} from "react-icons/bs";

export const Workspace = () => {
  const {
    blocks,
    addBlock,
    removeBlock,
    updateBlockParam,
    clearWorkspace,
    isRunning,
    executeProgram,
    stopExecution,
    environment,
    addChildBlock,
    removeChildBlock,
    currentBlockId,
  } = useSimulador();
  const config = ENVIRONMENT_CONFIGS[environment];

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

  const getBorderColor = (category: BlockCategory) => {
    if (category === "event") return "border-[#00f5d4]";
    if (category === "action") return "border-[#94a3b8]";
    if (category === "condition") return "border-[#9b5de5]";
    if (category === "loop") return "border-[#f97316]";
    return "border-[#475569]";
  };

  const renderCategoryIcon = (category: BlockCategory, className?: string, style?: React.CSSProperties) => {
    switch (category) {
      case "event":
        return <BsPlayCircleFill className={className} style={style} />;
      case "action":
        return <BsArrowRight className={className} style={style} />;
      case "condition":
        return <BsCheckCircleFill className={className} style={style} />;
      case "loop":
        return <BsArrowRepeat className={className} style={style} />;
      default:
        return <BsGridFill className={className} style={style} />;
    }
  };

  const getCategoryColor = (category: BlockCategory): string => {
    switch (category) {
      case "event": return "#00f5d4";
      case "action": return "#94a3b8";
      case "condition": return "#9b5de5";
      case "loop": return "#f97316";
      default: return "#64748b";
    }
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
    const categoryColor = getCategoryColor(block.category);

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
        }`}
      >
        <div
          className={`flex items-center gap-2 p-2 px-3 min-w-[180px] shadow-md hover:shadow-lg transition-all duration-200 rounded-r ${
            isBlockActive ? "ring-2 ring-[#00f5d4]/60" : ""
          }`}
          style={{
            backgroundColor: isBlockActive ? "rgba(0, 245, 212, 0.08)" : "var(--surface)",
            borderLeft: `3px solid ${categoryColor}`,
            boxShadow: isBlockActive ? "0 0 20px rgba(0, 245, 212, 0.15)" : undefined,
          }}
        >
          {/* Block Number */}
          <span
            className="font-mono text-[9px] font-bold min-w-[24px]"
            style={{ color: categoryColor }}
          >
            {blockNumber}.
          </span>

          {/* Block Icon */}
          {renderCategoryIcon(block.category, "text-[12px]", { color: categoryColor })}

          {/* Block Content */}
          <div className="flex-1 min-w-0">
            <span
              className="font-mono text-[10px] block truncate"
              style={{ color: "var(--text)" }}
            >
              {getBlockLabel(block.type, block.params)}
            </span>
            {hasOptions && def?.paramOptions && (
              <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                {Object.entries(def.paramOptions).map(([pName, options]) => (
                  <select
                    key={pName}
                    value={block.params[pName] || def.params?.[pName] || options[0]?.value || ""}
                    onChange={(e) => updateBlockParam(block.id, pName, e.target.value)}
                    className="text-[8px] p-1 bg-bg border border-border text-text focus:outline-none focus:border-primary w-full rounded"
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
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-danger/20 rounded"
            style={{ color: "var(--text-muted)" }}
          >
            <BsXLg className="text-[12px]" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: "var(--bg)" }}
    >

      {/* Workspace Content */}
      <div
        className="flex-1 overflow-y-auto p-4 relative"
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {/* Grid Background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(150, 150, 150, 0.3) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        ></div>

        {blocks.length === 0 ? (
          /* Empty State */
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            <div
              className="w-full max-w-[280px] p-4 rounded-lg border border-dashed border-border"
              style={{ backgroundColor: "var(--surface)" }}
            >
              {/* Icon */}
              <div className="flex justify-center mb-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "var(--bg)" }}
                >
                  <BsBraces className="text-2xl text-primary opacity-60" />
                </div>
              </div>

              {/* Title */}
              <h3 className="font-mono text-[11px] text-text text-center mb-2 font-semibold">
                Sin bloques aún
              </h3>

              {/* Description */}
              <p className="font-mono text-[9px] text-text-muted text-center mb-4 leading-relaxed">
                Arrastra bloques desde el panel izquierdo o haz clic en los botones de abajo para comenzar.
              </p>

              {/* Quick Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => addBlock("inicio", "event", {})}
                  className="w-full flex items-center gap-2 p-2 rounded border border-border hover:border-[#00f5d4] hover:bg-[#00f5d4]/10 transition-colors text-left"
                  style={{ backgroundColor: "var(--bg)" }}
                >
                  <BsPlayCircleFill className="text-[12px] text-[#00f5d4]" />
                  <span className="font-mono text-[9px] text-text">Agregar INICIO</span>
                </button>

                <button
                  onClick={() => addBlock("repetir", "loop", { iteraciones: "3" })}
                  className="w-full flex items-center gap-2 p-2 rounded border border-border hover:border-[#f97316] hover:bg-[#f97316]/10 transition-colors text-left"
                  style={{ backgroundColor: "var(--bg)" }}
                >
                  <BsArrowRepeat className="text-[12px] text-[#f97316]" />
                  <span className="font-mono text-[9px] text-text">Agregar REPETIR</span>
                </button>

                <button
                  onClick={() => addBlock("avanzar", "action", { distancia: "30" })}
                  className="w-full flex items-center gap-2 p-2 rounded border border-border hover:border-[#94a3b8] hover:bg-[#94a3b8]/10 transition-colors text-left"
                  style={{ backgroundColor: "var(--bg)" }}
                >
                  <BsArrowRight className="text-[12px] text-[#94a3b8]" />
                  <span className="font-mono text-[9px] text-text">Agregar AVANZAR</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Blocks List */
          <div className="relative z-10 flex flex-col gap-1 items-start">
            {blocks.map((block, index) => renderBlock(block, index))}
          </div>
        )}
      </div>
    </div>
  );
};
