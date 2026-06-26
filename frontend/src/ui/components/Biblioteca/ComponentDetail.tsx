import { useEffect, useState } from "react";
import type { ComponentWikiEntry } from "../../../shared/constants/componentWiki";
import { Modal } from "../common/Modal";
import { generateMermaid } from "../../../application/adapters/mermaidGenerator";
import { ENVIRONMENT_CONFIGS } from "../../../shared/constants/environmentConfigs";
import type { Block, BlockDefinition } from "../../../shared/types/Simulador";
import { WiringDiagram } from "./WiringDiagram";

const THEME_BADGE: Record<string, { label: string; class: string }> = {
  movimiento: { label: "Movimiento", class: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  sensores: { label: "Sensores", class: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  actuadores: { label: "Actuadores", class: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  control: { label: "Control", class: "bg-purple-500/15 text-purple-400 border-purple-500/20" },
  comunicacion: { label: "Comunicación", class: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20" },
  estructura: { label: "Estructura", class: "bg-rose-500/15 text-rose-400 border-rose-500/20" },
};

const findBlockDefs = (types: string[]): BlockDefinition[] => {
  const all: BlockDefinition[] = [];
  const seen = new Set<string>();
  for (const cfg of Object.values(ENVIRONMENT_CONFIGS)) {
    for (const b of cfg.blocks) {
      if (types.includes(b.type) && !seen.has(b.type)) {
        all.push(b);
        seen.add(b.type);
      }
    }
  }
  return all;
};

export const ComponentDetail = ({
  component,
  isOpen,
  onClose,
}: {
  component: ComponentWikiEntry;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [mermaidSvg, setMermaidSvg] = useState("");
  const badge = THEME_BADGE[component.theme];

  const blockDefs = findBlockDefs(component.relatedBlockTypes);

  useEffect(() => {
    if (!isOpen || blockDefs.length === 0) return;
    let cancelled = false;

    const blocks = (blockDefs as (BlockDefinition & { _exampleParams?: Record<string, string> })[]).map((bd, i) => {
      const exampleParams: Record<string, string> = {};
      if (bd.params) {
        for (const key of Object.keys(bd.params)) {
          exampleParams[key] = bd.paramOptions?.[key]?.[0]?.value ?? "";
        }
      }
      return {
        id: `b${i}`,
        type: bd.type,
        category: bd.category,
        params: exampleParams,
        children: (bd.category === "loop"
          ? [{ id: `b${i}_child`, type: "accion_ejemplo", category: "action" as const, params: {} as Record<string, string>, children: [] }]
          : []) as Block[],
        parentId: undefined,
      };
    });

    const def = generateMermaid(blocks, blockDefs);
    import("mermaid").then((mermaid) => {
      if (cancelled) return;
      mermaid.default.initialize({
        startOnLoad: false,
        theme: "base",
        securityLevel: "strict",
        flowchart: { curve: "basis", htmlLabels: true, nodeSpacing: 34, rankSpacing: 42 },
        themeVariables: {
          background: "transparent",
          primaryColor: "#172033",
          primaryTextColor: "#e5edf8",
          primaryBorderColor: "#52627a",
          lineColor: "#718096",
          fontFamily: "Geist, ui-sans-serif, system-ui",
        },
      });
      mermaid.default
        .render(`wiki-mermaid-${component.id}`, def)
        .then(({ svg }) => {
          if (!cancelled) setMermaidSvg(svg);
        })
        .catch(() => {});
    });

    return () => { cancelled = true; };
  }, [isOpen, component.id]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-5xl" height="min(92vh, 860px)">
      <div className="p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border ${badge.class}`}>
              {badge.label}
            </span>
            <h2 className="text-2xl font-bold tracking-tight">{component.name}</h2>
            <p className="text-sm text-muted-foreground/80 leading-relaxed">{component.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
          {/* Technical Specs */}
          <div className="space-y-4">
            <h3 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Especificaciones Técnicas
            </h3>
            <div className="space-y-2">
              {component.technicalSpecs.map((spec) =>
                spec.label ? (
                  <div key={spec.label} className="flex justify-between items-center py-2 px-3 bg-muted/30 rounded-lg border border-border/10">
                    <span className="text-[10px] font-semibold text-muted-foreground/70">{spec.label}</span>
                    <span className="text-[10px] font-mono font-bold text-foreground/80">{spec.value}</span>
                  </div>
                ) : null
              )}
            </div>
          </div>

          {/* Wiring */}
          <div className="space-y-4">
            <h3 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Conexionado / Wiring
            </h3>
            <WiringDiagram componentName={component.name} wiring={component.wiring} />
          </div>
        </div>

        {/* Industrial Uses */}
        <div className="space-y-4">
          <h3 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
            Usos Industriales
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {component.industrialUses.map((use) => (
              <div key={use} className="flex items-center gap-2 py-1.5 px-3 border border-border/5 rounded-lg text-xs text-muted-foreground/70">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                {use}
              </div>
            ))}
          </div>
        </div>

        {/* Related Blocks */}
        {blockDefs.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Bloques Relacionados en el Simulador
            </h3>
            <div className="flex flex-wrap gap-2">
              {blockDefs.map((bd) => (
                <span
                  key={bd.type}
                  className="text-[10px] font-mono font-bold px-2.5 py-1.5 rounded-md border"
                  style={{ borderColor: bd.color + "40", color: bd.color, backgroundColor: bd.color + "15" }}
                >
                  {bd.label}
                </span>
              ))}
            </div>
            {mermaidSvg && (
              <div
                className="mermaid flex min-h-52 justify-center overflow-x-auto rounded-xl border border-border/20 bg-muted/10 p-4 [&_svg]:h-auto [&_svg]:max-w-full"
                dangerouslySetInnerHTML={{ __html: mermaidSvg }}
              />
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
