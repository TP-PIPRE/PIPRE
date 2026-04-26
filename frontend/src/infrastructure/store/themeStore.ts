// frontend/src/infrastructure/store/themeStore.ts
import { create } from "zustand";
import { themes } from "../../shared/constants/themes";

// Restore theme from localStorage on load
const storedTheme = (() => {
  try {
    const raw = localStorage.getItem("pipre_theme");
    return raw ? JSON.parse(raw) : "light"; // Default to "light" if no theme is stored
  } catch {
    return "light";
  }
})();

type ThemeKey = keyof typeof themes;

interface ThemeState {
  currentThemeName: ThemeKey;
  currentTheme: (typeof themes)[ThemeKey];
  setTheme: (themeName: ThemeKey) => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  const initialThemeName: ThemeKey =
    storedTheme in themes ? storedTheme : "light";
  return {
    currentThemeName: initialThemeName,
    currentTheme: themes[initialThemeName],
    setTheme: (themeName) => {
      const theme = themes[themeName];
      if (theme) {
        localStorage.setItem("pipre_theme", JSON.stringify(themeName));
        set({ currentThemeName: themeName, currentTheme: theme });
      }
    },
  };
});
