import { useState, useId, useRef, useEffect } from "react";
import { ENVIRONMENT_CONFIGS } from "../../shared/constants/environmentConfigs";
import { ENERGY_COST } from "../../shared/constants/energyCosts";
import { generateMermaid } from "../../application/adapters/mermaidGenerator";
import { BsRocketFill, BsCrosshair, BsGrid3X3GapFill, BsSpeedometer2, BsDiagram3Fill, BsLightningFill } from "react-icons/bs";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import type { EnvironmentType, BlockCategory } from "../../shared/types/Simulador";

const ENV_META: Record<EnvironmentType, { color: string; Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }> = {
  battle: { color: "#ef4444", Icon: BsCrosshair },
  space: { color: "#3b82f6", Icon: BsRocketFill },
  maze: { color: "#8b5cf6", Icon: BsGrid3X3GapFill },
  obstacle: { color: "#f97316", Icon: BsSpeedometer2 },
};

const CATEGORY_LABELS: Record<BlockCategory, string> = {
  event: "Evento",
  action: "Acci\u00f3n",
  condition: "Condici\u00f3n",
  loop: "Bucle",
};

const CATEGORY_COLORS: Record<BlockCategory, string> = {
  event: "#00f5d4",
  action: "#94a3b8",
  condition: "#9b5de5",
  loop: "#f97316",
};

function defaultMermaidExample(blockType: string, _: string, category: BlockCategory): string {
  if (category === "event") {
    return generateMermaid([
      { id: "b0", type: blockType, category, params: {} },
      { id: "b1", type: "avanzar", category: "action", params: { distancia: "40" } },
    ]);
  }
  if (category === "loop") {
    return generateMermaid([
      { id: "b0", type: "al_iniciar_sistema", category: "event", params: {} },
      {
        id: "b1",
        type: blockType,
        category,
        params: { iteraciones: "3" },
        children: [
          { id: "c0", type: "avanzar", category: "action", params: { distancia: "40" } },
          { id: "c1", type: "girar", category: "action", params: { angulo: "90" } },
        ],
      },
    ]);
  }
  if (category === "condition") {
    return generateMermaid([
      { id: "b0", type: "al_iniciar_sistema", category: "event", params: {} },
      { id: "b1", type: blockType, category, params: { distancia: "10" } },
      { id: "b2", type: "avanzar", category: "action", params: { distancia: "40" } },
    ]);
  }
  return generateMermaid([
    { id: "b0", type: "al_iniciar_sistema", category: "event", params: {} },
    { id: "b1", type: blockType, category, params: {} },
  ]);
}

export function BibliotecaPage() {
  const [selectedEnv, setSelectedEnv] = useState<EnvironmentType>("battle");
  const [selectedBlock, setSelectedBlock] = useState<{ type: string; label: string; category: BlockCategory } | null>(null);
  const [showDiagram, setShowDiagram] = useState(false);
  const uid = useId();

  const config = ENVIRONMENT_CONFIGS[selectedEnv];
  const meta = ENV_META[selectedEnv];
  const Icon = meta.Icon;
  const blocks = config?.blocks || [];

  const envIds = Object.keys(ENVIRONMENT_CONFIGS) as EnvironmentType[];
  const envColors: Record<EnvironmentType, string> = {
    battle: "#ef4444",
    space: "#3b82f6",
    maze: "#8b5cf6",
    obstacle: "#f97316",
  };

  return (
    <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
      <header className="mb-8">
        <h1 className="text-xl font-mono font-bold tracking-tight mb-2">
          Biblioteca de Bloques
        </h1>
        <p className="text-sm text-muted-foreground">
          Explora los componentes disponibles por entorno y visualiza diagramas de ejemplo con Mermaid.
        </p>
      </header>

      <div className="flex gap-2 mb-8 flex-wrap">
        {envIds.map((eid) => {
          const cfg = ENVIRONMENT_CONFIGS[eid];
          const active = selectedEnv === eid;
          return (
            <button
              key={eid}
              onClick={() => setSelectedEnv(eid)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all"
              style={{
                backgroundColor: active ? envColors[eid] : undefined,
                borderColor: active ? envColors[eid] : undefined,
                color: active ? "#fff" : undefined,
              }}
            >
              {cfg?.name || eid}
            </button>
          );
        })}
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Icon className="text-xl" style={{ color: meta.color }} />
          <div>
            <h2 className="text-base font-bold font-mono">{config?.name}</h2>
            <p className="text-xs text-muted-foreground">{config?.description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {blocks.map((block) => {
          const cost = ENERGY_COST[block.type] ?? 0;
          const catColor = CATEGORY_COLORS[block.category];
          const catLabel = CATEGORY_LABELS[block.category];
          return (
            <Card key={block.type} className="group hover:shadow-lg transition-all cursor-pointer" onClick={() => {
              setSelectedBlock({ type: block.type, label: block.label, category: block.category });
              setShowDiagram(true);
            }}>
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-xs font-mono font-bold uppercase tracking-wider">
                    {block.label}
                  </CardTitle>
                  <div className="flex gap-1 shrink-0">
                  <span
                    className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider border"
                    style={{
                      backgroundColor: `${catColor}22`,
                      color: catColor,
                      borderColor: catColor,
                    }}
                  >
                    {catLabel}
                  </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {block.description && (
                  <p className="text-[10px] text-muted-foreground mb-2 line-clamp-2">
                    {block.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5 items-center text-[9px] text-muted-foreground font-mono">
                  <span className="flex items-center gap-0.5">
                    <BsLightningFill className="text-[8px]" />
                    {cost}
                  </span>
                  {block.hardwareRequired && (
                    <Badge variant="outline" className="text-[8px] px-1 py-0 font-mono">
                      {block.hardwareRequired}
                    </Badge>
                  )}
                  {block.paramOptions && Object.keys(block.paramOptions).length > 0 && (
                    <span className="opacity-60">
                      {Object.keys(block.paramOptions).join(", ")}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-1 text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  <BsDiagram3Fill className="text-[9px]" />
                  Ver diagrama
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={showDiagram} onOpenChange={setShowDiagram}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-mono font-bold uppercase tracking-wider">
              Diagrama de ejemplo: {selectedBlock?.label}
            </DialogTitle>
          </DialogHeader>
          {selectedBlock && (
            <MermaidPreview
              key={`${uid}-${selectedBlock.type}`}
              definition={defaultMermaidExample(selectedBlock.type, selectedBlock.label, selectedBlock.category)}
            />
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function MermaidPreview({ definition }: { definition: string }) {
  const [mermaidError, setMermaidError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    setMermaidError(null);
    const el = containerRef.current;
    el.textContent = definition;
    import("mermaid").then((mermaid) => {
      mermaid.default
        .run({ nodes: [el] })
        .catch((err: Error) => setMermaidError(err.message));
    });
  }, [definition]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(definition);
  };

  return (
    <div>
      <div className="flex justify-end gap-2 mb-2">
        <button
          onClick={copyToClipboard}
          className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
        >
          Copiar
        </button>
      </div>
      <div className="border rounded-lg p-4 bg-white/5 overflow-x-auto min-h-[100px] flex items-center justify-center">
        {mermaidError ? (
          <div className="text-[10px] text-destructive font-mono">
            Error al renderizar: {mermaidError}
            <pre className="mt-2 text-muted-foreground text-[8px] max-w-full overflow-x-auto whitespace-pre-wrap">{definition}</pre>
          </div>
        ) : (
          <div ref={containerRef} className="mermaid w-full" />
        )}
      </div>
    </div>
  );
}

export default BibliotecaPage;
