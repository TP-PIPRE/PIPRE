import React, { useState, useCallback, useRef } from "react";
import {
  BsXLg,
  BsChevronDown,
  BsPlusLg,
  BsArrowRepeat,
  BsRepeat,
  BsColumnsGap,
  BsPlayFill,
  BsCheckCircleFill,
  BsQuestionSquareFill,
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
  block: Block & { children?: Block[] };
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
      case "repetir": return "repeat";
      case "mientras": return "loop";
      case "por_cada": return "dynamic_feed";
      default: return "repeat";
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
      case "action": return "arrow_right";
      case "condition": return "check_circle";
      case "loop": return "repeat";
      default: return "arrow_right";
    }
  };

  return (
    <div
      className={`relative transition-all duration-200 ${
        isActive ? "ring-2 ring-green-400/50 scale-[1.01] z-10" : "hover:shadow-md"
      }`}
      style={{
        borderRadius: "14px",
        backgroundColor: isActive ? "rgba(34, 197, 94, 0.06)" : "var(--surface)",
        boxShadow: isActive
          ? `0 0 24px ${color}20, 0 4px 12px rgba(0,0,0,0.08)`
          : `0 1px 3px rgba(0,0,0,0.06)`,
        borderLeft: `3px solid ${color}`,
      }}
    >
      {/* Header */}
      <button
        className="flex items-center justify-between w-full px-3 py-2.5 cursor-pointer hover:bg-surface-brighter/50 transition-colors rounded-tr-xl rounded-br-xl"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="font-mono text-xs font-bold min-w-[32px]"
            style={{ color }}
          >
            {blockNumber}
          </span>

          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
            {renderLoopIcon(getLoopIcon(), "text-sm")}
          </div>

          <span className="text-[12px] text-text font-semibold">
            {label}
          </span>

          {children.length > 0 && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-lg font-semibold"
              style={{ backgroundColor: `${color}15`, color }}
            >
              {children.length} {children.length === 1 ? "bloque" : "bloques"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <BsChevronDown
            className="text-xs text-text-muted transition-transform"
            style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(block.id);
            }}
            className="p-1.5 hover:bg-red-500/15 rounded-lg transition-colors ml-1"
          >
            <BsXLg className="text-xs text-red-400" />
          </button>
        </div>
      </button>

      {/* Collapsed summary */}
      {!isExpanded && children.length > 0 && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-1.5 text-[10px] text-text-muted/50">
            <BsPlayFill className="text-[10px]" />
            <span>{children.length} bloques internos</span>
          </div>
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-border/30">
          {/* Param Options */}
          {paramOptions && Object.keys(paramOptions).length > 0 && (
            <div className="pt-3 space-y-1.5">
              {Object.entries(paramOptions).map(([paramName, options]) => (
                <div key={paramName}>
                  <select
                    value={block.params[paramName] || options[0]?.value || ""}
                    onChange={(e) => onParamChange(block.id, paramName, e.target.value)}
                    className="w-full text-[11px] p-1.5 bg-bg border border-border text-text rounded-lg focus:outline-none focus:border-primary/50 transition-colors"
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

          {/* Children Blocks - Drop Zone */}
          <div className="mt-3">
            <div className="text-[10px] text-text-muted/60 mb-2 font-semibold uppercase tracking-wider">
              Bloques internos
            </div>

            <div
              ref={dropRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="transition-all duration-150 rounded-xl"
              style={{
                border: isDragOver ? `2px dashed ${color}` : "2px dashed transparent",
                backgroundColor: isDragOver ? `${color}08` : "transparent",
              }}
            >
              {children.length > 0 ? (
                <div className="space-y-1 pl-4 border-l-2" style={{ borderColor: `${color}30` }}>
                  {children.map((child, childIndex) => (
                    <div
                      key={child.id}
                      className={`flex items-center justify-between p-2 rounded-lg text-[11px] font-medium group transition-all duration-200 ${
                        currentExecutingBlockId === child.id
                          ? "ring-1 ring-green-400/40 bg-green-400/5"
                          : "bg-bg hover:bg-surface-brighter"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="font-mono text-[10px] font-bold min-w-[24px]"
                          style={{ color }}
                        >
                          {blockNumber}.{childIndex + 1}
                        </span>
                        {renderLoopIcon(getChildBlockIcon(child), "text-[11px]")}
                        <span className="text-text">{getChildBlockLabel(child)}</span>
                      </div>
                      {onRemoveChild && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveChild(block.id, child.id);
                          }}
                          className="p-1 hover:bg-red-500/15 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <BsXLg className="text-[10px] text-red-400" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className={`text-[11px] text-center py-4 rounded-xl border-2 border-dashed transition-colors ${
                    isDragOver
                      ? "border-primary/60 text-primary/70 bg-primary/5"
                      : "border-border text-text-muted/40"
                  }`}
                >
                  {isDragOver ? "Suelta el bloque aqui!" : "Arrastra bloques aqui dentro"}
                </div>
              )}
            </div>

            {/* Add Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowBlockPicker(!showBlockPicker);
              }}
              className="mt-2 w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold text-primary hover:text-primary/80 py-2 rounded-lg border-2 border-dashed border-primary/25 hover:border-primary/50 transition-all active:scale-[0.98]"
            >
              <BsPlusLg className="text-[10px]" />
              Agregar bloque
            </button>

            {/* Block Picker */}
            {showBlockPicker && (
              <div
                className="mt-2 p-2 rounded-xl border border-border bg-bg shadow-sm"
              >
                <div className="flex flex-wrap gap-1.5">
                  {availableBlocks.map((availBlock) => (
                    <button
                      key={availBlock.type}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddChild(availBlock.type, availBlock.label, availBlock.category);
                      }}
                      className="px-2.5 py-1.5 text-[11px] font-medium rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 active:scale-95 transition-all"
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
    </div>
  );
};
