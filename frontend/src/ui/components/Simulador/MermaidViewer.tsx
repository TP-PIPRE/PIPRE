import { useEffect, useRef, useMemo, useState } from "react";
import mermaid from "mermaid";
import { BsXLg, BsClipboardFill } from "react-icons/bs";
import { useSimulador } from "../../../application/context/SimuladorProvider";
import { generateMermaid } from "../../../application/adapters/mermaidGenerator";
import { Modal } from "../common/Modal";
import { ENVIRONMENT_CONFIGS } from "../../../shared/constants/environmentConfigs";

mermaid.initialize({ theme: "dark", startOnLoad: false });

interface MermaidViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MermaidViewer = ({ isOpen, onClose }: MermaidViewerProps) => {
  const { blocks, environment } = useSimulador();
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  const definition = useMemo(() => {
    const config = ENVIRONMENT_CONFIGS[environment];
    return generateMermaid(blocks, config?.blocks);
  }, [blocks, environment]);

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
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider" style={{ color: "var(--text)" }}>
            Diagrama de Flujo
          </h2>
          <div className="flex items-center gap-2">
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
          className="overflow-auto max-h-[70vh] p-4 rounded-lg border border-border bg-bg flex justify-center"
          style={{ maxWidth: "100%" }}
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <LegendDot color="#00f5d4" label="Evento" />
          <LegendDot color="#94a3b8" label="Acción" />
          <LegendDot color="#9b5de5" label="Condición" />
          <LegendDot color="#f97316" label="Bucle" />
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
