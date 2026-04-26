import { BrowserRouter as Router } from "react-router-dom";
import { AppRouter } from "./ui/router";
import { useThemeStore } from "./infrastructure/store/themeStore";
import { useEffect } from "react";

const App = () => {
  const { currentTheme } = useThemeStore();

  // Asignar variables CSS dinámicamente
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--theme-bg",
      currentTheme.colors.bg,
    );
    document.documentElement.style.setProperty(
      "--theme-surface",
      currentTheme.colors.surface,
    );
    document.documentElement.style.setProperty(
      "--theme-surface-brighter",
      currentTheme.colors.surfaceBrighter,
    );
    document.documentElement.style.setProperty(
      "--theme-primary",
      currentTheme.colors.primary,
    );
    document.documentElement.style.setProperty(
      "--theme-primary-low",
      currentTheme.colors.primaryLow,
    );
    document.documentElement.style.setProperty(
      "--theme-primary-glow",
      currentTheme.colors.primaryGlow,
    );
    document.documentElement.style.setProperty(
      "--theme-border",
      currentTheme.colors.border,
    );
    document.documentElement.style.setProperty(
      "--theme-text",
      currentTheme.colors.text,
    );
    document.documentElement.style.setProperty(
      "--theme-text-muted",
      currentTheme.colors.textMuted,
    );
    document.documentElement.style.setProperty(
      "--theme-text-inverted",
      currentTheme.colors.textInverted,
    );
    document.documentElement.style.setProperty(
      "--theme-accent",
      currentTheme.colors.accent,
    );
    document.documentElement.style.setProperty(
      "--theme-success",
      currentTheme.colors.success,
    );
    document.documentElement.style.setProperty(
      "--theme-danger",
      currentTheme.colors.danger,
    );
    document.documentElement.style.setProperty(
      "--theme-radius",
      (currentTheme as any).borderRadius || "8px",
    );
  }, [currentTheme]);

  return (
    <Router>
      <div
        className="min-h-screen transition-colors duration-300"
        style={{
          backgroundColor: `var(--theme-bg)`,
          color: `var(--theme-text)`,
        }}
      >
        <AppRouter />
      </div>
    </Router>
  );
};

export default App;
