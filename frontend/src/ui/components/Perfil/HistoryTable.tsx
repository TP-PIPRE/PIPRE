import type { StudentHistoryDTO } from "../../../infrastructure/api/models/apiModels";
import { BsStarFill } from "react-icons/bs";

interface HistoryTableProps {
  history: StudentHistoryDTO[];
}

const StarDisplay = ({ count }: { count: number }) => {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <BsStarFill
          key={i}
          className="text-[8px]"
          style={{ color: i <= count ? "var(--accent)" : "var(--border)" }}
        />
      ))}
    </span>
  );
};

export const HistoryTable = ({ history }: HistoryTableProps) => {
  if (history.length === 0) {
    return (
      <div
        className="border border-border p-6 text-center"
        style={{
          backgroundColor: "var(--surface)",
          borderRadius: "var(--theme-radius)",
        }}
      >
        <p className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
          No hay historial disponible. Completa un reto para ver tus resultados aquí.
        </p>
      </div>
    );
  }

  return (
    <div
      className="border border-border overflow-hidden"
      style={{
        backgroundColor: "var(--surface)",
        borderRadius: "var(--theme-radius)",
      }}
    >
      <div
        className="px-4 py-2.5 border-b border-border flex items-center justify-between"
        style={{ backgroundColor: "var(--surface-brighter)" }}
      >
        <h3 className="text-[10px] font-bold font-mono uppercase tracking-widest" style={{ color: "var(--text)" }}>
          Historial
        </h3>
        <span className="text-[8px] font-mono" style={{ color: "var(--text-muted)" }}>
          {history.length} resultados
        </span>
      </div>

      <div className="divide-y divide-border">
        {history.map((entry) => (
          <div
            key={entry.idResult}
            className="flex items-center px-4 py-2.5 hover:bg-surface-brighter/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-semibold truncate" style={{ color: "var(--text)" }}>
                {entry.activityName}
              </div>
              <div className="text-[8px] font-mono" style={{ color: "var(--text-muted)" }}>
                {new Date(entry.dateAttempted).toLocaleDateString()}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StarDisplay count={entry.stars} />
              <span className="font-mono text-[10px] font-bold min-w-[40px] text-right" style={{ color: "var(--primary)" }}>
                {entry.score}
              </span>
              <span className="font-mono text-[8px]" style={{ color: "var(--text-muted)" }}>
                +{entry.xpEarned} XP
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
