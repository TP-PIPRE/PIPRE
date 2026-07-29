import React from "react";
import { LEVEL_CONFIGS, type LevelConfig } from "../../../infrastructure/threejs/shared/levelConfigs";
import { loadProgress } from "../../../application/adapters/PlayerProgress";
import { BsStarFill, BsLockFill, BsCrosshair, BsRocketFill, BsGrid3X3GapFill, BsSpeedometer2 } from "react-icons/bs";

const ENV_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  battle: BsCrosshair,
  space: BsRocketFill,
  maze: BsGrid3X3GapFill,
  obstacle: BsSpeedometer2,
};

const ENV_NAMES: Record<string, string> = {
  battle: "Batalla",
  space: "Exploracion",
  maze: "Laberinto",
  obstacle: "Carrera",
};

interface LevelSelectorProps {
  onSelectLevel: (levelId: string) => void;
  selectedLevelId: string | null;
}

export const LevelSelector: React.FC<LevelSelectorProps> = ({ onSelectLevel, selectedLevelId }) => {
  const progress = loadProgress();
  const allLevels = Object.values(LEVEL_CONFIGS);

  const isUnlocked = (level: LevelConfig): boolean => {
    if (!level.prevLevelId) return true;
    const prev = progress.completedLevels[level.prevLevelId];
    return prev && prev.stars >= (level.unlockStars || 0);
  };

  const getStars = (levelId: string): number => {
    return progress.completedLevels[levelId]?.stars || 0;
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-text">Niveles</h2>
        <span className="text-[11px] text-text-muted">Estrellas: {progress.totalStars}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {allLevels.map((level) => {
          const unlocked = isUnlocked(level);
          const stars = getStars(level.id);
          const isSelected = selectedLevelId === level.id;
          const Icon = ENV_ICONS[level.environment] || BsCrosshair;

          return (
            <button
              key={level.id}
              onClick={() => unlocked && onSelectLevel(level.id)}
              disabled={!unlocked}
              className={`relative p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                  : unlocked
                  ? "border-border bg-surface hover:border-primary/40 hover:shadow-md"
                  : "border-border/40 bg-surface/30 opacity-50 cursor-not-allowed"
              }`}
            >
              {!unlocked && (
                <BsLockFill className="absolute top-2 right-2 text-xs text-text-muted/40" />
              )}
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className="text-base text-primary" />
                <span className="text-[11px] font-bold text-text">{level.name}</span>
              </div>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[9px] text-text-muted bg-surface-brighter px-1.5 py-0.5 rounded">
                  {ENV_NAMES[level.environment] || level.environment}
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                  level.difficulty === 1 ? "bg-green-500/10 text-green-500" :
                  level.difficulty === 2 ? "bg-amber-500/10 text-amber-500" :
                  "bg-red-500/10 text-red-500"
                }`}>
                  {"★".repeat(level.difficulty)}
                </span>
              </div>
              <div className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <BsStarFill
                    key={i}
                    className={`text-sm ${i < stars ? "text-amber-400" : "text-border/30"}`}
                  />
                ))}
              </div>
              <p className="text-[9px] text-text-muted/60 mt-1 line-clamp-2">{level.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
