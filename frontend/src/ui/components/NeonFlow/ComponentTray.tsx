import type { OpticalComponent } from "../../../shared/types/NeonFlow";
import { NEON_DND_TYPE, OPTICAL_COLORS } from "../../../shared/constants/neonFlow";

export const ComponentTray: React.FC = () => {
  const handleDragStart = (e: React.DragEvent, component: OpticalComponent) => {
    e.dataTransfer.setData(NEON_DND_TYPE, JSON.stringify(component));
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="flex flex-wrap gap-3 rounded-xl bg-surface border border-border shadow-lg p-3">
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, { type: "MIRROR_90" })}
        className="cursor-grab active:cursor-grabbing rounded-lg bg-surface-brighter border border-border p-2 hover:border-primary transition-colors"
        title="Espejo 90° - arrastra al tablero, click derecho para rotar">
        <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-border">
          <div className="h-[2px] w-[70%] rotate-45 rounded-full bg-cyan-300" />
        </div>
        <p className="mt-1 text-center text-[10px] font-bold text-text-muted">Espejo 90°</p>
      </div>

      {OPTICAL_COLORS.map((color) => (
        <div
          key={color}
          draggable
          onDragStart={(e) => handleDragStart(e, { type: "FILTER", color })}
          className="cursor-grab active:cursor-grabbing rounded-lg bg-surface-brighter border border-border p-2 hover:border-primary transition-colors"
          title={`Filtro ${color} - arrastra al tablero`}>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full border-2"
            style={{ borderColor: color }}>
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
          </div>
          <p className="mt-1 text-center text-[10px] font-bold text-text-muted">
            Filtro {color}
          </p>
        </div>
      ))}
    </div>
  );
};
