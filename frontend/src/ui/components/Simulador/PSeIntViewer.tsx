interface PSeIntViewerProps {
  pseudocode: string;
  diagram: string;
}

export const PSeIntViewer = ({ pseudocode, diagram }: PSeIntViewerProps) => {
  const isMermaid = diagram.trim().startsWith("graph") || diagram.trim().startsWith("flowchart");

  return (
    <div className="flex flex-col gap-6">
      {/* Pseudocode */}
      <div>
        <h4 className="text-[10px] uppercase font-bold tracking-widest text-text-muted mb-2">
          Pseudocódigo
        </h4>
        <pre
          className="p-4 bg-bg border border-border text-sm text-text font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap"
          style={{ borderRadius: "var(--theme-radius)", minHeight: 120 }}
        >
          {pseudocode || "Sin pseudocódigo generado."}
        </pre>
      </div>

      {/* PSeInt Diagram */}
      <div>
        <h4 className="text-[10px] uppercase font-bold tracking-widest text-text-muted mb-2">
          Diagrama de Flujo
        </h4>
        {isMermaid ? (
          <div
            className="p-4 bg-bg border border-border text-sm text-text"
            style={{ borderRadius: "var(--theme-radius)" }}
          >
            <pre className="font-mono text-xs text-primary leading-relaxed whitespace-pre-wrap">
              {diagram}
            </pre>
            <div className="mt-2 text-[9px] text-text-muted italic">
              * Renderizar con librería Mermaid
            </div>
          </div>
        ) : (
          <pre
            className="p-4 bg-bg border border-border text-sm text-text font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap"
            style={{ borderRadius: "var(--theme-radius)", minHeight: 80 }}
          >
            {diagram || "Sin diagrama generado."}
          </pre>
        )}
      </div>
    </div>
  );
};
