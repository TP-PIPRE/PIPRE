// frontend/src/infrastructure/store/themeStore.ts
import { create } from "zustand";
import type { Theme } from "../../shared/constants/themes";
import { THEMES } from "../../shared/constants/themes";

interface ThemeState {
  currentTheme: Theme;
  setTheme: (themeName: string) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  currentTheme: THEMES.claro,
  setTheme: (themeName) =>
    set({ currentTheme: THEMES[themeName] || THEMES.claro }),
}));
