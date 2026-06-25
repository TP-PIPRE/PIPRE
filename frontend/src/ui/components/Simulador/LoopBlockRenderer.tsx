import React, { useState, useCallback, useRef } from "react";
import {
  BsXLg,
  BsGearFill,
  BsPlusLg,
  BsGrid3X3GapFill,
  BsArrowRepeat,
  BsRepeat,
  BsColumnsGap,
  BsPlayFill,
  BsCheckCircleFill,
  BsQuestionSquareFill
} from "react-icons/bs";
import type { Block, BlockCategory } from "../../../shared/types/Simulador";

const LOOP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  repeat: BsRepeat,
  loop: BsArrowRepeat,
  dynamic_feed: BsColumnsGap,
  arrow_right: BsPlayFill,
  check_circle: BsCheckCircleFill,
};

const renderLoopIcon = (iconName: string, className?: string) => {
  const IconComponent = LOOP_ICONS[iconName] || BsQuestionSquareFill;
  return <IconComponent className={className} />;
};

interface LoopBlockRendererProps {
  block: Block & {
    children?: Block[];
  };
  label: string;
  color?: string;
  blockNumber?: string;
  onRemove: (id: string) => void;
  onParamChange: (id: string, param: string, value: string) => void;
  onAddChild?: (parentId: string, block: Omit<Block, "id">) => void;
  onRemoveChild?: (parentId: string, childId: string) => void;
  paramOptions?: Record<string, { label: string; value: string }[]>;
  availableBlocks?: Array<{ type: string; label: string; category: BlockCategory }>;
  isActive?: boolean;
  currentExecutingBlockId?: string | null;
}

export const LoopBlockRenderer: React.FC<LoopBlockRendererProps> = ({
  block,
  label,
  color = "#f97316",
  blockNumber = "1",
  onRemove,
  onParamChange,
  onAddChild,
  onRemoveChild,
  paramOptions,
  availableBlocks = [],
  isActive = false,
  currentExecutingBlockId = null,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const children = block.children || [];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    if (!isDragOver) setIsDragOver(true);
  }, [isDragOver]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (dropRef.current && !dropRef.current.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.type && data.category && onAddChild) {
        onAddChild(block.id, {
          type: data.type,
          category: data.category,
          params: data.params || {},
        });
      }
    } catch {
      // ignore invalid drops
    }
  }, [block.id, onAddChild]);

  const getLoopIcon = () => {
    switch (block.type) {
      case "repetir":
        return "repeat";
      case "mientras":
        return "loop";
      case "por_cada":
        return "dynamic_feed";
      default:
        return "repeat";
    }
  };

  const handleAddChild = useCallback(
    (childType: string, _childLabel: string, childCategory: BlockCategory) => {
      if (onAddChild) {
        onAddChild(block.id, {
          type: childType,
          category: childCategory,
          params: {},
        });
      }
      setShowBlockPicker(false);
    },
    [block.id, onAddChild]
  );

  const getChildBlockLabel = (childBlock: Block) => {
    const blockDef = availableBlocks.find((b) => b.type === childBlock.type);
    return blockDef?.label || childBlock.type;
  };

  const getChildBlockIcon = (childBlock: Block) => {
    switch (childBlock.category) {
      case "action":
        return "arrow_right";
      case "condition":
        return "check_circle";
      case "loop":
        return "repeat";
      default:
        return "arrow_right";
    }
  };

  return (
    <div
      className={`relative rounded-lg overflow-hidden transition-all duration-200 ${
        isActive ? "ring-2 ring-[#00f5d4]/60" : ""
      }`}
      style={{
        borderLeft: `3px solid ${color}`,
        backgroundColor: isActive ? "rgba(0, 245, 212, 0.08)" : "var(--surface)",
        boxShadow: isActive ? "0 0 20px rgba(0, 245, 212, 0.15)" : "none",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-2 cursor-pointer hover:bg-surface-brighter transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {/* Block Number */}
          <span
            className="font-mono text-[9px] font-bold min-w-[32px]"
            style={{ color }}
          >
            {blockNumber}.
          </span>

          <BsGrid3X3GapFill className="text-[9px] text-text-muted/30 cursor-grab" />
          {renderLoopIcon(getLoopIcon(), "text-[12px]")}
          <span className="font-mono text-[10px] text-text font-semibold">
            {label}
          </span>
          {children.length > 0 && (
            <span
              className="text-[8px] px-1.5 py-0.5 rounded font-mono"
              style={{
                backgroundColor: `${color}20`,
                color: color,
              }}
            >
              {children.length} {children.length === 1 ? "bloque" : "bloques"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1 hover:bg-surface rounded transition-colors"
          >
            <BsGearFill className="text-[8px] text-text-muted" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(block.id);
            }}
            className="p-1 hover:bg-danger/20 rounded transition-colors"
          >
            <BsXLg className="text-[8px] text-danger" />
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-2 pb-2 border-t border-border/50">
          {/* Param Options */}
          {paramOptions && Object.keys(paramOptions).length > 0 && (
            <div className="pt-2 space-y-1">
              {Object.entries(paramOptions).map(([paramName, options]) => (
                <div key={paramName}>
                  <select
                    value={block.params[paramName] || options[0]?.value || ""}
                    onChange={(e) => onParamChange(block.id, paramName, e.target.value)}
                    className="w-full text-[9px] p-1 bg-bg border border-border text-text focus:outline-none focus:border-primary rounded"
                  >
                    {options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Children Blocks — Drop Zone */}
          <div className="mt-2">
            <div className="text-[8px] text-text-muted/70 mb-1 font-mono uppercase">
              Bloques internos:
            </div>
            
            <div
              ref={dropRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="transition-all duration-150"
              style={{
                borderRadius: "6px",
                border: isDragOver ? `2px dashed ${color}` : "2px dashed transparent",
                backgroundColor: isDragOver ? `${color}10` : "transparent",
              }}
            >
              {children.length > 0 ? (
                <div className="space-y-1 pl-3 border-l-2" style={{ borderColor: `${color}40` }}>
                  {children.map((child, childIndex) => (
                    <div
                      key={child.id}
                      className={`flex items-center justify-between p-1.5 rounded text-[9px] font-mono group transition-all duration-200 ${
                        currentExecutingBlockId === child.id ? "ring-1 ring-[#00f5d4]/50" : ""
                      }`}
                      style={{
                        backgroundColor: currentExecutingBlockId === child.id ? "rgba(0, 245, 212, 0.1)" : "var(--bg)",
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="font-mono text-[8px] font-bold min-w-[20px]"
                          style={{ color }}
                        >
                          {blockNumber}.{childIndex + 1}
                        </span>
                        {renderLoopIcon(getChildBlockIcon(child), "text-[10px]")}
                        <span className="text-text">{getChildBlockLabel(child)}</span>
                      </div>
                      {onRemoveChild && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveChild(block.id, child.id);
                          }}
                          className="p-0.5 hover:bg-danger/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <BsXLg className="text-[7px] text-danger" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className={`text-[8px] text-center py-3 rounded border border-dashed transition-colors ${
                    isDragOver
                      ? "border-primary text-primary/70"
                      : "border-border text-text-muted/50"
                  }`}
                >
                  {isDragOver ? "Soltar bloque aquí" : "Arrastra bloques aquí"}
                </div>
              )}
            </div>

            {/* Add Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowBlockPicker(!showBlockPicker);
              }}
              className="mt-2 w-full flex items-center justify-center gap-1 text-[9px] text-primary hover:text-primary/80 py-1 rounded border border-dashed border-primary/30 hover:border-primary/50 transition-colors"
            >
              <BsPlusLg className="text-[7px]" />
              Agregar
            </button>

            {/* Block Picker */}
            {showBlockPicker && (
              <div
                className="mt-2 p-2 rounded border border-border"
                style={{ backgroundColor: "var(--bg)" }}
              >
                <div className="flex flex-wrap gap-1">
                  {availableBlocks.map((availBlock) => (
                    <button
                      key={availBlock.type}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddChild(
                          availBlock.type,
                          availBlock.label,
                          availBlock.category
                        );
                      }}
                      className="px-2 py-1 text-[8px] font-mono rounded border border-border hover:border-primary/50 hover:bg-primary/10 transition-colors"
                    >
                      {availBlock.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collapsed Indicator */}
      {!isExpanded && children.length > 0 && (
        <div className="px-2 pb-1.5">
          <div className="flex items-center gap-1 text-[8px] text-text-muted/60">
            <BsPlayFill className="text-[8px]" />
            <span>{children.length} {children.length === 1 ? "bloque" : "bloques"}</span>
          </div>
        </div>
      )}
    </div>
  );
};
