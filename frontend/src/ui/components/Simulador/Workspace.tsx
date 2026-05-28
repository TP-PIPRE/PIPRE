import React from "react";
import { useSimulador } from "../../../application/context/SimuladorProvider";
import type { BlockCategory } from "../../../shared/types/Simulador";

export const Workspace = () => {
  const {
    blocks,
    addBlock,
    removeBlock,
    clearWorkspace,
    isRunning,
    executeProgram,
    stopExecution,
  } = useSimulador();

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
    if (category === "action") return "border-slate-400";
    if (category === "condition") return "border-[#9b5de5]";
    return "border-slate-600";
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: "var(--bg)" }}
    >
      {/* Header / Toolbar */}
      <div
        className="p-4 border-b flex justify-between items-center"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface)",
        }}
      >
        <h3
          className="font-mono text-xs tracking-[0.15em] uppercase"
          style={{ color: "var(--text-muted)" }}
        >
          Ensamblaje Lógico
        </h3>
        <div className="flex gap-2">
          <button
            onClick={isRunning ? stopExecution : executeProgram}
            className={`px-6 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
              isRunning
                ? "bg-[var(--danger)] text-[var(--text-inverted)] hover:bg-[var(--danger)] shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                : "bg-[var(--primary)] text-[var(--text-inverted)] hover:bg-[var(--primary)] shadow-[0_0_15px_var(--primary-glow)]"
            }`}
          >
            {isRunning ? "HALT" : "INIT SECUENCIA"}
          </button>
          <button
            onClick={clearWorkspace}
            disabled={isRunning}
            className={`px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
              isRunning
                ? "opacity-50"
                : "hover:bg-[var(--surface-brighter)] hover:text-[var(--text)]"
            }`}
            style={{
              color: "var(--text-muted)",
              backgroundColor: "var(--surface)",
            }}
          >
            PURGAR
          </button>
        </div>
      </div>

      {/* Drop Area */}
      <div
        className="flex-1 overflow-y-auto p-8 relative"
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(150, 150, 150, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(150, 150, 150, 0.2) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        ></div>

        {blocks.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center font-mono text-xs uppercase tracking-widest pointer-events-none">
            <span
              className="material-symbols-outlined text-4xl mb-2 opacity-50"
              style={{ color: "var(--text-muted)" }}
            >
              data_object
            </span>
            <span style={{ color: "var(--text-muted)" }}>
              Esperando instrucciones...
            </span>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col gap-1 items-start">
            {blocks.map((block) => (
              <div
                key={block.id}
                className={`backdrop-blur-sm border-l-4 ${getBorderColor(block.category)} p-3 px-4 min-w-[200px] flex justify-between items-center shadow-lg group hover:bg-[var(--surface-brighter)] transition-colors`}
                style={{ backgroundColor: "var(--surface)" }}
              >
                <span
                  className="font-mono text-sm"
                  style={{ color: "var(--text)" }}
                >
                  {block.type.toUpperCase()}
                </span>
                <button
                  onClick={() => removeBlock(block.id)}
                  className="hover:text-[var(--danger)] opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--text-muted)" }}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    close
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
