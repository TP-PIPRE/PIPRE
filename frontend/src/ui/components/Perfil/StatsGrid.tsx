import type { PlayerProfileDTO } from "../../../infrastructure/api/models/apiModels";
import { BsStarFill, BsLightningFill, BsTrophyFill, BsCheckCircleFill, BsBarChartFill, BsAwardFill } from "react-icons/bs";

interface StatsGridProps {
  profile: PlayerProfileDTO;
}

const statItems = (p: PlayerProfileDTO) => [
  {
    icon: BsStarFill,
    value: `${p.totalStars}`,
    label: "Estrellas",
    color: "var(--accent)",
  },
  {
    icon: BsLightningFill,
    value: `${p.currentStreak}`,
    label: "Racha actual",
    sub: `Máx: ${p.maxStreak}`,
    color: "var(--primary)",
  },
  {
    icon: BsCheckCircleFill,
    value: `${p.challengesCompleted}`,
    label: "Retos",
    color: "var(--success)",
  },
  {
    icon: BsBarChartFill,
    value: `${Math.round(p.efficiencyAvg)}%`,
    label: "Eficiencia",
    color: "var(--primary)",
  },
  {
    icon: BsTrophyFill,
    value: `#${p.position || "-"}`,
    label: "Ranking",
    color: "var(--accent)",
  },
  {
    icon: BsAwardFill,
    value: `${p.totalPoints ?? 0}`,
    label: "Puntos totales",
    color: "var(--primary)",
  },
];

export const StatsGrid = ({ profile }: StatsGridProps) => {
  return (
    <div
      className="border border-border p-4"
      style={{
        backgroundColor: "var(--surface)",
        borderRadius: "var(--theme-radius)",
      }}
    >
      <h3 className="text-[10px] font-bold font-mono uppercase tracking-widest mb-3" style={{ color: "var(--text)" }}>
        Estadísticas
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {statItems(profile).map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="p-3 border text-center"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--bg)",
                borderRadius: "var(--theme-radius)",
              }}
            >
              <Icon className="text-sm mb-1 mx-auto" style={{ color: item.color }} />
              <div className="text-sm font-black font-mono" style={{ color: "var(--text)" }}>
                {item.value}
              </div>
              <div className="text-[7px] font-mono uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                {item.label}
              </div>
              {item.sub && (
                <div className="text-[6px] font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {item.sub}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
