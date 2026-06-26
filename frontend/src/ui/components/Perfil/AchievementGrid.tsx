import type { AchievementDTO } from "../../../infrastructure/api/models/apiModels";
import { BsLockFill } from "react-icons/bs";

interface AchievementGridProps {
  achievements: AchievementDTO[];
}

const categoryIcons: Record<string, string> = {
  progreso: "\u{1F3C6}",
  bucles: "\u{1F501}",
  eficiencia: "\u26A1",
  persistencia: "\uD83D\uDD25",
  exploracion: "\uD83C\uDF0D",
  desafio: "\uD83D\uDD0B",
  velocidad: "\u23F0",
  maestria: "\u2B50",
  competitivo: "\uD83D\uDC51",
};

export const AchievementGrid = ({ achievements }: AchievementGridProps) => {
  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked && !a.hidden);

  return (
    <div
      className="border border-border p-4"
      style={{
        backgroundColor: "var(--surface)",
        borderRadius: "var(--theme-radius)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-bold font-mono uppercase tracking-widest" style={{ color: "var(--text)" }}>
          Logros
        </h3>
        <span className="text-[8px] font-mono" style={{ color: "var(--text-muted)" }}>
          {unlocked.length}/{achievements.length}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {[...unlocked, ...locked].map((ach) => {
          const isUnlocked = ach.unlocked;
          return (
            <div
              key={ach.idAchievement}
              className="relative flex flex-col items-center p-2 border text-center transition-all"
              style={{
                borderColor: isUnlocked ? "var(--primary)" : "var(--border)",
                backgroundColor: isUnlocked ? "rgba(var(--primary-rgb), 0.05)" : "var(--bg)",
                borderRadius: "var(--theme-radius)",
                opacity: isUnlocked ? 1 : 0.4,
              }}
              title={`${ach.name}: ${ach.description}${ach.hidden ? " (oculto)" : ""}`}
            >
              {isUnlocked ? (
                <span className="text-lg mb-1">{categoryIcons[ach.category] || "\u{1F3C6}"}</span>
              ) : (
                <BsLockFill className="text-sm mb-1" style={{ color: "var(--text-muted)" }} />
              )}
              <span className="text-[6px] font-mono font-bold uppercase leading-tight" style={{ color: "var(--text)" }}>
                {isUnlocked ? ach.name : ach.hidden ? "???" : ach.name}
              </span>
              {isUnlocked && ach.unlockedAt && (
                <span className="text-[5px] font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {new Date(ach.unlockedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
