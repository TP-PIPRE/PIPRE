import { useMemo, useState } from "react";
import { useSimulador } from "../../../application/context/SimuladorProvider";
import { ENVIRONMENT_CONFIGS } from "../../../shared/constants/environmentConfigs";
import { analyzeBlocks, type FeedbackItem } from "../../../application/adapters/blockAnalyzer";
import { ComponentDetail } from "../Biblioteca/ComponentDetail";
import type { ComponentWikiEntry } from "../../../shared/constants/componentWiki";

const TYPE_ICON: Record<FeedbackItem["type"], string> = {
  tip: "\uD83D\uDCA1",
  warning: "\u26A0\uFE0F",
  error: "\u274C",
  info: "\u2139\uFE0F",
};

const CATEGORY_LABELS: Record<FeedbackItem["category"], string> = {
  hardware: "Hardware",
  energy: "Energ\u00eda",
  structure: "Estructura",
  blocks: "Bloques",
  wiki: "Wiki",
};

export const ChatbotPanel = () => {
  const { environment, blocks, installedHardware } = useSimulador();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [wikiComponent, setWikiComponent] = useState<ComponentWikiEntry | null>(null);

  const envConfig = ENVIRONMENT_CONFIGS[environment];

  const feedback = useMemo(() => {
    if (!envConfig) return [];
    return analyzeBlocks(blocks, envConfig, installedHardware);
  }, [blocks, installedHardware, envConfig]);

  if (!envConfig) return null;

  return (
    <div className="flex flex-col h-full text-[11px]">
      {/* Header */}
      <div className="shrink-0 px-3 py-2 border-b border-border/30 flex items-center gap-2">
        <span className="text-xs">\uD83E\uDD16</span>
        <span className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground/70">
          Feedback Inteligente
        </span>
        <span className="ml-auto text-[9px] text-muted-foreground/40 font-mono">
          {feedback.length}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {blocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <span className="text-lg mb-2 opacity-30">\uD83E\uDD16</span>
            <p className="text-[10px] text-muted-foreground/40 font-medium leading-relaxed">
              Arrastra bloques al &aacute;rea de trabajo para recibir feedback.
            </p>
          </div>
        ) : feedback.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <span className="text-lg mb-2 opacity-30">\u2705</span>
            <p className="text-[10px] text-muted-foreground/40 font-medium">
              Todo en orden. Buen trabajo.
            </p>
          </div>
        ) : (
          feedback.map((item) => {
            const isOpen = expanded === item.id;
            return (
              <div key={item.id}>
                <button
                  onClick={() => setExpanded(isOpen ? null : item.id)}
                  className="w-full flex items-start gap-2.5 p-2.5 rounded-lg border border-border/10 hover:bg-muted/20 transition-colors text-left"
                  style={{ borderLeft: `3px solid var(--${item.type === "error" ? "danger" : item.type === "warning" ? "theme-accent" : "theme-primary"})` }}
                >
                  <span className="shrink-0 text-xs mt-0.5">{TYPE_ICON[item.type]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground/50">
                        {CATEGORY_LABELS[item.category]}
                      </span>
                      <span className={`text-[8px] font-bold uppercase px-1 py-0.5 rounded-sm ${
                        item.type === "error" ? "bg-danger/10 text-danger" :
                        item.type === "warning" ? "bg-amber-500/10 text-amber-400" :
                        "bg-primary/10 text-primary"
                      }`}>
                        {item.type === "error" ? "Error" : item.type === "warning" ? "Advertencia" : item.type === "tip" ? "Sugerencia" : "Info"}
                      </span>
                    </div>
                    <p className="text-[10px] font-medium text-foreground/80 leading-snug">
                      {item.message}
                    </p>
                  </div>
                  <span className="shrink-0 text-[8px] text-muted-foreground/30 mt-1 transition-transform" style={{ transform: isOpen ? "rotate(90deg)" : undefined }}>
                    \u203A
                  </span>
                </button>

                {isOpen && (
                  <div className="ml-6 mt-1 mb-1.5 pl-3 border-l-2 border-border/20 space-y-2">
                    {item.detail && (
                      <p className="text-[9px] text-muted-foreground/60 leading-relaxed">
                        {item.detail}
                      </p>
                    )}
                    {item.wikiEntries && item.wikiEntries.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground/40">
                          Componentes relacionados en la wiki:
                        </p>
                        {item.wikiEntries.map((w) => (
                          <button
                            key={w.id}
                            onClick={() => setWikiComponent(w)}
                            className="block text-left w-full text-[9px] text-primary/70 hover:text-primary underline underline-offset-2 transition-colors"
                          >
                            {w.name}
                          </button>
                        ))}
                      </div>
                    )}
                    {item.relatedBlockTypes && item.relatedBlockTypes.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.relatedBlockTypes.map((bt) => {
                          const def = envConfig.blocks.find((b) => b.type === bt);
                          return def ? (
                            <span
                              key={bt}
                              className="text-[7px] font-mono font-bold px-1.5 py-0.5 rounded-sm"
                              style={{ backgroundColor: def.color + "18", color: def.color }}
                            >
                              {def.label}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Wiki detail modal */}
      {wikiComponent && (
        <ComponentDetail
          component={wikiComponent}
          isOpen={!!wikiComponent}
          onClose={() => setWikiComponent(null)}
        />
      )}
    </div>
  );
};
