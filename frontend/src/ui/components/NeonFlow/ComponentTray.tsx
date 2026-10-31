import type { OpticalComponent } from "../../../shared/types/NeonFlow";
import { NEON_DND_TYPE, OPTICAL_COLORS } from "../../../shared/constants/neonFlow";

export const ComponentTray = ({ selected, onSelect }: { selected?: OpticalComponent | null; onSelect?: (component: OpticalComponent) => void }) => {
  const handleDragStart = (e: React.DragEvent, component: OpticalComponent) => {
    e.dataTransfer.setData(NEON_DND_TYPE, JSON.stringify(component));
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="lab-tray" aria-label="Componentes ópticos">
      <button type="button"
        draggable
        aria-pressed={selected?.type === "MIRROR_90"}
        onClick={() => onSelect?.({ type: "MIRROR_90" })}
        onDragStart={(e) => handleDragStart(e, { type: "MIRROR_90" })}
        className="lab-piece cursor-grab active:cursor-grabbing"
        title="Espejo 90° - arrastra al tablero, click derecho para rotar">
        <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-border">
          <div className="h-[2px] w-[70%] -rotate-45 rounded-full bg-cyan-300" />
        </div>
        <p className="mt-1 text-center text-[10px] font-bold text-text-muted">Espejo 90°</p>
      </button>

      {OPTICAL_COLORS.map((color) => (
        <button type="button"
          key={color}
          aria-pressed={selected?.type === "FILTER" && selected.color === color}
          onClick={() => onSelect?.({ type: "FILTER", color })}
          draggable
          onDragStart={(e) => handleDragStart(e, { type: "FILTER", color })}
          className="lab-piece cursor-grab active:cursor-grabbing"
          title={`Filtro ${color} - arrastra al tablero`}>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full border-2"
            style={{ borderColor: color }}>
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
          </div>
          <p className="mt-1 text-center text-[10px] font-bold text-text-muted">
            Filtro {color}
          </p>
        </button>
      ))}
    </div>
  );
};
