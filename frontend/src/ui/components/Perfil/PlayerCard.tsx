import type { PlayerProfileDTO } from "../../../infrastructure/api/models/apiModels";
import { BsTrophyFill, BsStarFill, BsLightningFill, BsPersonFill } from "react-icons/bs";

interface PlayerCardProps {
  profile: PlayerProfileDTO;
}

const xpForNextLevel = (level: number) => level * 500;

export const PlayerCard = ({ profile }: PlayerCardProps) => {
  const nextLevelXp = xpForNextLevel(profile.level);
  const progress = Math.min(100, (profile.xpTotal / nextLevelXp) * 100);

  return (
    <div
      className="border border-border p-5 relative overflow-hidden"
      style={{
        backgroundColor: "var(--surface)",
        borderRadius: "var(--theme-radius)",
      }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
        <BsTrophyFill className="w-full h-full" />
      </div>

      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 flex items-center justify-center border-2"
          style={{
            backgroundColor: "var(--bg)",
            borderColor: "var(--primary)",
            borderRadius: "var(--theme-radius)",
          }}
        >
          <BsPersonFill className="text-2xl" style={{ color: "var(--primary)" }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-lg font-bold truncate" style={{ color: "var(--text)" }}>
              {profile.studentName}
            </h2>
            <span
              className="px-2 py-0.5 text-[9px] font-black font-mono uppercase tracking-wider rounded-full"
              style={{
                backgroundColor: "rgba(var(--primary-rgb), 0.15)",
                color: "var(--primary)",
              }}
            >
              Nvl {profile.level}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
            <span className="flex items-center gap-1">
              <BsStarFill className="text-[9px]" style={{ color: "var(--accent)" }} />
              {profile.totalStars} estrellas
            </span>
            <span className="flex items-center gap-1">
              <BsLightningFill className="text-[9px]" style={{ color: "var(--primary)" }} />
              {profile.currentStreak} racha
            </span>
            <span>
              #{profile.position} ranking
            </span>
          </div>

          <div className="mt-3">
            <div className="flex justify-between text-[8px] font-mono mb-1" style={{ color: "var(--text-muted)" }}>
              <span>XP: {profile.xpTotal.toLocaleString()} / {nextLevelXp.toLocaleString()}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${progress}%`,
                  backgroundColor: "var(--primary)",
                  boxShadow: "0 0 6px var(--primary)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
