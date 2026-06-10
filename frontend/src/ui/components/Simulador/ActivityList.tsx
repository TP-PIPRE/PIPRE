import type { ActivityResponse } from "../../../shared/types/SpecContracts";

interface ActivityListProps {
  activities: ActivityResponse[];
  selectedId: string | null;
  onSelect: (activity: ActivityResponse) => void;
}

export const ActivityList = ({
  activities,
  selectedId,
  onSelect,
}: ActivityListProps) => {
  if (activities.length === 0) {
    return (
      <div className="p-6 text-center text-text-muted text-sm border border-dashed border-border">
        No hay actividades disponibles para este grupo.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-[10px] uppercase font-bold tracking-widest text-text-muted mb-1">
        Actividades
      </h3>
      {activities.map((a) => {
        const isSelected = a.id === selectedId;
        return (
          <button
            key={a.id}
            onClick={() => onSelect(a)}
            className={`w-full text-left p-3 border text-sm transition-all duration-200 ${
              isSelected
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-bg text-text hover:border-primary/40"
            }`}
            style={{ borderRadius: "var(--theme-radius)" }}
          >
            <div className="font-semibold">{a.name}</div>
            <div className="text-[10px] text-text-muted mt-1 uppercase tracking-wider">
              {a.difficulty}
              {a.type && ` · ${a.type}`}
            </div>
          </button>
        );
      })}
    </div>
  );
};
