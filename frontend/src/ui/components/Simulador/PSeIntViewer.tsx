import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "base",
  themeVariables: {
    background: "transparent",
    primaryColor: "var(--primary)",
    secondaryColor: "var(--accent)",
    tertiaryColor: "var(--surface-brighter)",
    primaryTextColor: "var(--text)",
    secondaryTextColor: "var(--text-muted)",
    lineColor: "var(--border)",
    fontFamily: "inherit",
    fontSize: "12px",
  },
});

interface PSeIntViewerProps {
  pseudocode: string;
  diagram: string;
}

export const PSeIntViewer = ({ pseudocode, diagram }: PSeIntViewerProps) => {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const renderIdRef = useRef(0);

  const isMermaid =
    diagram.trim().startsWith("graph") ||
    diagram.trim().startsWith("flowchart");

  useEffect(() => {
    if (!isMermaid || !diagram || !mermaidRef.current) return;

    const currentId = ++renderIdRef.current;
    setRenderError(null);

    mermaid
      .render(`mermaid-${currentId}`, diagram)
      .then(({ svg }) => {
        if (currentId === renderIdRef.current && mermaidRef.current) {
          mermaidRef.current.innerHTML = svg;
        }
      })
      .catch((err) => {
        if (currentId === renderIdRef.current) {
          setRenderError(err instanceof Error ? err.message : "Error al renderizar diagrama");
        }
      });
  }, [diagram, isMermaid]);

  return (
    <div className="flex flex-col gap-6">
      {pseudocode && (
        <div>
          <h4 className="text-[10px] uppercase font-bold tracking-widest text-text-muted mb-2">
            Pseudocódigo
          </h4>
          <pre
            className="p-4 bg-bg border border-border text-sm text-text font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap"
            style={{ borderRadius: "var(--theme-radius)", minHeight: 120 }}
          >
            {pseudocode}
          </pre>
        </div>
      )}

      {isMermaid && diagram && (
        <div>
          <h4 className="text-[10px] uppercase font-bold tracking-widest text-text-muted mb-2">
            Diagrama de Flujo
          </h4>
          <div
            className="p-4 bg-bg border border-border flex justify-center"
            style={{ borderRadius: "var(--theme-radius)", minHeight: 120 }}
          >
            {renderError ? (
              <pre className="font-mono text-xs text-danger whitespace-pre-wrap">
                {diagram}
                <div className="mt-2 text-text-muted italic">
                  Error: {renderError}
                </div>
              </pre>
            ) : (
              <div ref={mermaidRef} className="max-w-full overflow-x-auto" />
            )}
          </div>
        </div>
      )}

      {!isMermaid && diagram && (
        <div>
          <h4 className="text-[10px] uppercase font-bold tracking-widest text-text-muted mb-2">
            Diagrama de Flujo
          </h4>
          <pre
            className="p-4 bg-bg border border-border text-sm text-text font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap"
            style={{ borderRadius: "var(--theme-radius)", minHeight: 80 }}
          >
            {diagram}
          </pre>
        </div>
      )}
    </div>
  );
};
