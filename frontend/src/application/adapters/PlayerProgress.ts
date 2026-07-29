const STORAGE_KEY = "pipre_player_progress";

export interface LevelProgress {
  completed: boolean;
  stars: number;
  bestBlocks: number;
  bestEnergy: number;
  completedAt?: string;
}

export interface PlayerProgress {
  completedLevels: Record<string, LevelProgress>;
  totalStars: number;
  achievements: string[];
  tutorialCompleted: boolean;
}

export function loadProgress(): PlayerProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return {
        completedLevels: data.completedLevels || {},
        totalStars: data.totalStars || 0,
        achievements: data.achievements || [],
        tutorialCompleted: data.tutorialCompleted || false,
      };
    }
  } catch (e) {
    console.warn("Failed to load progress", e);
  }
  return {
    completedLevels: {},
    totalStars: 0,
    achievements: [],
    tutorialCompleted: false,
  };
}

export function saveProgress(progress: PlayerProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function saveLevelResult(levelId: string, stars: number, blocks: number, energy: number): PlayerProgress {
  const progress = loadProgress();
  const existing = progress.completedLevels[levelId];

  if (!existing || stars > existing.stars || blocks < existing.bestBlocks) {
    progress.completedLevels[levelId] = {
      completed: true,
      stars: existing ? Math.max(existing.stars, stars) : stars,
      bestBlocks: existing ? Math.min(existing.bestBlocks, blocks) : blocks,
      bestEnergy: existing ? Math.max(existing.bestEnergy, energy) : energy,
      completedAt: new Date().toISOString(),
    };
  }

  progress.totalStars = Object.values(progress.completedLevels).reduce((sum, l) => sum + l.stars, 0);
  saveProgress(progress);
  return progress;
}

export function markTutorialComplete(): void {
  const progress = loadProgress();
  progress.tutorialCompleted = true;
  saveProgress(progress);
}

export function unlockAchievement(achievementId: string): void {
  const progress = loadProgress();
  if (!progress.achievements.includes(achievementId)) {
    progress.achievements.push(achievementId);
    saveProgress(progress);
  }
}

export const ACHIEVEMENTS: Record<string, { id: string; name: string; icon: string; description: string }> = {
  FIRST_PROGRAM: { id: "FIRST_PROGRAM", name: "Primer Programa", icon: "play", description: "Ejecutaste tu primer programa" },
  THREE_STARS: { id: "THREE_STARS", name: "Excelencia", icon: "star", description: "Completaste un nivel con 3 estrellas" },
  EXPLORER: { id: "EXPLORER", name: "Explorador", icon: "globe", description: "Jugaste en los 4 mundos" },
  MASTER: { id: "MASTER", name: "Maestro Robotico", icon: "trophy", description: "Completaste todos los niveles" },
  EFFICIENT: { id: "EFFICIENT", name: "Eficiente", icon: "lightning", description: "Completaste un nivel usando la mitad de bloques permitidos" },
};
