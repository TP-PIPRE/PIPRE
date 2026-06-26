export interface MissionResult {
  score: number;
  blocksUsed: number;
  maxBlocks: number;
  energyRemaining: number;
  loopsUsed: number;
  nestedLoops: number;
  environmentsCompleted: string[];
  consecutiveCompletions: number;
}

export interface StarsResult {
  stars: 0 | 1 | 2 | 3;
  label: string;
  color: string;
}

export interface ComboResult {
  multiplier: number;
  bonus: number;
  label: string;
}

const STAR_THRESHOLDS = [
  { minScore: 90, blockRatio: 0.5, stars: 3 as const, label: "Excelente", color: "var(--accent)" },
  { minScore: 70, blockRatio: 0.75, stars: 2 as const, label: "Bien", color: "var(--primary)" },
  { minScore: 50, blockRatio: 1.0, stars: 1 as const, label: "Regular", color: "var(--success)" },
];

export function calculateStars(result: MissionResult): StarsResult {
  for (const threshold of STAR_THRESHOLDS) {
    if (
      result.score >= threshold.minScore &&
      result.blocksUsed <= result.maxBlocks * threshold.blockRatio
    ) {
      return { stars: threshold.stars, label: threshold.label, color: threshold.color };
    }
  }
  return { stars: 1, label: "Completado", color: "var(--success)" };
}

export function calculateCombo(consecutiveCompletions: number): ComboResult {
  if (consecutiveCompletions >= 5) return { multiplier: 3, bonus: 500, label: "COMBO x3 🔥🔥🔥" };
  if (consecutiveCompletions >= 3) return { multiplier: 2, bonus: 250, label: "COMBO x2 🔥🔥" };
  if (consecutiveCompletions >= 2) return { multiplier: 1.5, bonus: 100, label: "Racha 🔥" };
  return { multiplier: 1, bonus: 0, label: "" };
}

export function calculateEfficiency(blocksUsed: number, maxBlocks: number, loopsUsed: number): number {
  if (maxBlocks === 0) return 1.0;
  const blockEfficiency = 1 - (blocksUsed / maxBlocks);
  const loopBonus = Math.min(0.2, loopsUsed * 0.05);
  return Math.max(0, Math.min(1, blockEfficiency + loopBonus));
}

export function calculateXpEarned(
  stars: number,
  difficulty: "EASY" | "MEDIUM" | "HARD",
  comboMultiplier: number,
  efficiency: number
): number {
  const baseXp = { EASY: 50, MEDIUM: 100, HARD: 200 };
  const starMultiplier = stars;
  const difficultyBase = baseXp[difficulty];
  return Math.round(difficultyBase * starMultiplier * comboMultiplier * (0.8 + efficiency * 0.4));
}

export function checkAchievements(
  profile: {
    challengesCompleted: number;
    maxLoopIterations: number;
    maxNestedLoops: number;
    environmentsCompleted: string[];
    currentStreak: number;
    bestScore: number;
    top3Ranking: boolean;
  },
  currentUnlocks: string[]
): string[] {
  const newUnlocks: string[] = [];

  if (profile.challengesCompleted >= 1 && !currentUnlocks.includes("PRIMER_RETO")) {
    newUnlocks.push("PRIMER_RETO");
  }
  if (profile.maxLoopIterations >= 10 && !currentUnlocks.includes("ITERADOR_10")) {
    newUnlocks.push("ITERADOR_10");
  }
  if (profile.maxNestedLoops >= 3 && !currentUnlocks.includes("BUCLE_ANIDADO")) {
    newUnlocks.push("BUCLE_ANIDADO");
  }
  if (profile.currentStreak >= 3 && !currentUnlocks.includes("RACHA_3")) {
    newUnlocks.push("RACHA_3");
  }
  if (profile.environmentsCompleted.length >= 4 && !currentUnlocks.includes("EXPLORADOR")) {
    newUnlocks.push("EXPLORADOR");
  }
  if (profile.top3Ranking && !currentUnlocks.includes("TOP_3")) {
    newUnlocks.push("TOP_3");
  }

  return newUnlocks;
}

export const DIFFICULTY_CONFIG = {
  EASY: { starsRequired: 0, blockMultiplier: 1.0, energyMultiplier: 1.0 },
  MEDIUM: { starsRequired: 1, blockMultiplier: 0.75, energyMultiplier: 0.8 },
  HARD: { starsRequired: 2, blockMultiplier: 0.5, energyMultiplier: 0.6 },
};
