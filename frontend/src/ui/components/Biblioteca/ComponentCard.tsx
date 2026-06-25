import type { ComponentThemeId } from "../../../shared/constants/componentWiki";

const THEME_META: Record<ComponentThemeId, { bg: string; border: string; text: string }> = {
  movimiento: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400" },
  sensores: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400" },
  actuadores: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400" },
  control: { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400" },
  comunicacion: { bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-400" },
  estructura: { bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-400" },
};

export const ComponentCard = ({
  name,
  description,
  theme,
  blockCount,
  onClick,
}: {
  name: string;
  description: string;
  theme: ComponentThemeId;
  blockCount: number;
  onClick: () => void;
}) => {
  const meta = THEME_META[theme];
  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-start text-left p-5 border ${meta.border} ${meta.bg} rounded-xl transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-current/5 cursor-pointer w-full`}
    >
      <span className={`text-[10px] font-bold uppercase tracking-wider ${meta.text} mb-2`}>
        {theme}
      </span>
      <h3 className="text-sm font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors">
        {name}
      </h3>
      <p className="text-[11px] text-muted-foreground/70 leading-relaxed line-clamp-2 flex-1">
        {description}
      </p>
      {blockCount > 0 && (
        <span className="mt-3 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40">
          {blockCount} bloque{blockCount > 1 ? "s" : ""} relacionado{blockCount > 1 ? "s" : ""}
        </span>
      )}
    </button>
  );
};
