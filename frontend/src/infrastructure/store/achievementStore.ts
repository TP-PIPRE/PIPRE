import { create } from "zustand";
import type { AchievementDTO } from "../api/models/apiModels";
import type { GameVictoryDTO } from "../api/models/gameProgressModels";

interface AchievementState {
  revisions: Record<string, number>;
  notifications: Array<{ studentId: string; achievement: AchievementDTO }>;
  seen: Record<string, true>;
  confirmed: (studentId: string, victory: GameVictoryDTO) => void;
  dismiss: (studentId: string) => void;
}

export const useAchievementStore = create<AchievementState>((set) => ({
  revisions: {}, notifications: [], seen: {},
  confirmed: (studentId, victory) => set(state => {
    const seen = { ...state.seen };
    const fresh = victory.newAchievements.filter(achievement => {
      if (!achievement.unlocked || !achievement.unlockedAt) return false;
      const key = `${studentId}:${achievement.code}:${achievement.unlockedAt}`;
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
    return {
      seen,
      revisions: { ...state.revisions, [studentId]: (state.revisions[studentId] ?? 0) + 1 },
      notifications: [...state.notifications, ...fresh.map(achievement => ({ studentId, achievement }))],
    };
  }),
  dismiss: studentId => set(state => ({ notifications: state.notifications.filter(item => item.studentId !== studentId) })),
}));
