import { useState, useMemo } from "react";
import { COMPONENT_THEMES, COMPONENT_WIKI } from "../../shared/constants/componentWiki";
import { ComponentCard } from "../components/Biblioteca/ComponentCard";
import { ComponentDetail } from "../components/Biblioteca/ComponentDetail";
import type { ComponentThemeId, ComponentWikiEntry } from "../../shared/constants/componentWiki";

const THEME_META: Record<ComponentThemeId, { bg: string; border: string; text: string; ring: string }> = {
  movimiento: { bg: "bg-blue-500/8", border: "border-blue-500/15", text: "text-blue-400", ring: "ring-blue-500/30" },
  sensores: { bg: "bg-emerald-500/8", border: "border-emerald-500/15", text: "text-emerald-400", ring: "ring-emerald-500/30" },
  actuadores: { bg: "bg-amber-500/8", border: "border-amber-500/15", text: "text-amber-400", ring: "ring-amber-500/30" },
  control: { bg: "bg-purple-500/8", border: "border-purple-500/15", text: "text-purple-400", ring: "ring-purple-500/30" },
  comunicacion: { bg: "bg-cyan-500/8", border: "border-cyan-500/15", text: "text-cyan-400", ring: "ring-cyan-500/30" },
  estructura: { bg: "bg-rose-500/8", border: "border-rose-500/15", text: "text-rose-400", ring: "ring-rose-500/30" },
};

export function BibliotecaPage() {
  const [activeTheme, setActiveTheme] = useState<ComponentThemeId>("movimiento");
  const [selectedComponent, setSelectedComponent] = useState<ComponentWikiEntry | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const byTheme = COMPONENT_WIKI.filter((c) => c.theme === activeTheme);
    if (!search.trim()) return byTheme;
    const q = search.toLowerCase();
    return byTheme.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.industrialUses.some((u) => u.toLowerCase().includes(q)) ||
        c.relatedBlockTypes.some((t) => t.toLowerCase().includes(q)),
    );
  }, [activeTheme, search]);

  const activeMeta = THEME_META[activeTheme];

  return (
    <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
      <header className="mb-8">
        <h1 className="text-xl font-bold tracking-tight mb-2">
          Biblioteca de Componentes
        </h1>
        <p className="text-sm text-muted-foreground">
          Wiki t\u00e9cnica de componentes industriales. Cada entrada describe su uso real y lo relaciona con los bloques del simulador.
        </p>
      </header>

      {/* Search + Theme tabs */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {COMPONENT_THEMES.map((theme) => {
            const active = activeTheme === theme.id;
            const meta = THEME_META[theme.id];
            return (
              <button
                key={theme.id}
                onClick={() => setActiveTheme(theme.id)}
                className={
                  "flex items-center gap-2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-xl border transition-all " +
                  (active
                    ? meta.bg + " " + meta.border + " " + meta.text + " shadow-sm ring-1 " + meta.ring
                    : "border-border/20 text-muted-foreground/60 hover:border-border/40 hover:text-foreground")
                }
              >
                <span>{theme.icon}</span>
                {theme.name}
              </button>
            );
          })}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar componente..."
          className="w-full sm:w-56 h-9 px-3 text-[10px] bg-muted/30 border border-border/20 rounded-lg placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/30 transition-colors"
        />
      </div>

      {/* Section info */}
      <div className={"mb-6 px-4 py-3 rounded-xl border " + activeMeta.border + " " + activeMeta.bg}>
        <p className={"text-[11px] font-medium " + activeMeta.text}>
          {filtered.length} componente{filtered.length !== 1 ? "s" : ""} en esta categor\u00eda
        </p>
      </div>

      {/* Component grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((comp) => (
            <ComponentCard
              key={comp.id}
              name={comp.name}
              description={comp.description}
              theme={comp.theme}
              blockCount={comp.relatedBlockTypes.length}
              onClick={() => setSelectedComponent(comp)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-xs text-muted-foreground/40 font-medium">
            {search ? "No se encontraron componentes con esa b\u00fasqueda." : "No hay componentes en esta categor\u00eda."}
          </p>
        </div>
      )}

      {selectedComponent && (
        <ComponentDetail
          component={selectedComponent}
          isOpen={!!selectedComponent}
          onClose={() => setSelectedComponent(null)}
        />
      )}
    </main>
  );
}
