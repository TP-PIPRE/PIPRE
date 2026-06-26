import { useEffect, useRef, useMemo, useState } from "react";
import mermaid from "mermaid";
import { BsXLg, BsClipboardFill, BsPlayFill, BsStopFill } from "react-icons/bs";
import { useSimulador } from "../../../application/context/SimuladorProvider";
import { generateMermaid, generateExecutionTrace } from "../../../application/adapters/mermaidGenerator";
import { Modal } from "../common/Modal";
import { ENVIRONMENT_CONFIGS } from "../../../shared/constants/environmentConfigs";

mermaid.initialize({
  theme: "base",
  startOnLoad: false,
  securityLevel: "strict",
  flowchart: {
    curve: "basis",
    htmlLabels: true,
    nodeSpacing: 38,
    rankSpacing: 48,
    padding: 14,
  },
  themeVariables: {
    background: "transparent",
    primaryColor: "#172033",
    primaryTextColor: "#e5edf8",
    primaryBorderColor: "#52627a",
    lineColor: "#718096",
    fontFamily: "Geist, ui-sans-serif, system-ui",
  },
});

interface MermaidViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MermaidViewer = ({ isOpen, onClose }: MermaidViewerProps) => {
  const { blocks, environment, isRunning, currentBlockId } = useSimulador();
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [traceMode, setTraceMode] = useState(false);

  const definition = useMemo(() => {
    const config = ENVIRONMENT_CONFIGS[environment];
    if (traceMode && isRunning) {
      const iterContext = blocks
        .filter((b) => b.category === "loop")
        .map((b) => ({
          blockId: b.id,
          iteration: 1,
          total: parseInt(b.params?.iteraciones || "3", 10),
        }));
      return generateExecutionTrace(blocks, currentBlockId, iterContext);
    }
    return generateMermaid(blocks, config?.blocks);
  }, [blocks, environment, traceMode, isRunning, currentBlockId]);

  useEffect(() => {
    if (!isOpen || !mermaidRef.current) return;
    setError(null);
    const el = mermaidRef.current;
    el.textContent = definition;
    mermaid.run({ nodes: [el] }).catch((e) => {
      setError(e.message ?? "Error al renderizar diagrama");
    });
  }, [isOpen, definition]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(definition);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-5xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider" style={{ color: "var(--text)" }}>
            Diagrama de Flujo
          </h2>
          <div className="flex items-center gap-2">
            {isRunning && (
              <button
                onClick={() => setTraceMode(!traceMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider border rounded-md transition-all ${
                  traceMode ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-text-muted"
                }`}
              >
                {traceMode ? <BsPlayFill className="text-[9px]" /> : <BsStopFill className="text-[9px]" />}
                {traceMode ? "Traza activa" : "Traza"}
              </button>
            )}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider border border-border/60 text-text-muted hover:text-text hover:border-text-muted transition-all rounded-md"
            >
              <BsClipboardFill className="text-[9px]" />
              Copiar
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-surface-brighter rounded-md transition-colors">
              <BsXLg className="text-sm text-text-muted" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg border border-danger/30 bg-danger/5">
            <p className="font-mono text-[10px] text-danger">{error}</p>
          </div>
        )}

        <div
          ref={mermaidRef}
          className="flex max-h-[70vh] min-h-72 justify-center overflow-auto rounded-lg border border-border bg-bg p-4 [&_svg]:h-auto [&_svg]:max-w-full"
          style={{ maxWidth: "100%" }}
        />

        {traceMode && isRunning && (
          <div className="mt-3 p-2 rounded-md border border-primary/20 bg-primary/5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-[9px] text-primary font-bold uppercase tracking-wider">
              Traza de ejecución activa: el bloque actual se muestra resaltado
            </span>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <LegendDot color="#5eead4" label="Inicio / evento" />
          <LegendDot color="#94a3b8" label="Función / acción" />
          <LegendDot color="#c4b5fd" label="Decisión" />
          <LegendDot color="#fdba74" label="Bucle" />
          <LegendDot color="#86efac" label="Completado" />
        </div>
      </div>
    </Modal>
  );
};

const LegendDot = ({ color, label }: { color: string; label: string }) => (
  <span className="flex items-center gap-1.5 font-mono text-[9px] text-text-muted">
    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
    {label}
  </span>
);
