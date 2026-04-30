// frontend/src/application/hooks/useTheme.ts
import { useThemeStore } from "../../infrastructure/store/themeStore";

export const useTheme = () => {
  const { currentTheme, setTheme } = useThemeStore();
  return { currentTheme, setTheme };
};
