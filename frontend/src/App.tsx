import { BrowserRouter as Router } from "react-router-dom";
import { AppRouter } from "./ui/router";
import { useTheme } from "./application/hooks/useTheme";
import { useEffect } from "react";

const App = () => {
  const { currentTheme } = useTheme();

  // Asignar variables CSS dinámicamente
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--theme-bg",
      currentTheme.colors.background,
    );
    document.documentElement.style.setProperty(
      "--theme-surface",
      currentTheme.colors.accent,
    );
    document.documentElement.style.setProperty(
      "--theme-primary",
      currentTheme.colors.primary,
    );
    document.documentElement.style.setProperty(
      "--theme-primary-low",
      `${currentTheme.colors.primary}1a`,
    );
    document.documentElement.style.setProperty(
      "--theme-border",
      currentTheme.colors.text,
    );
    document.documentElement.style.setProperty(
      "--theme-text",
      currentTheme.colors.text,
    );
    document.documentElement.style.setProperty(
      "--theme-text-muted",
      `${currentTheme.colors.text}80`,
    );
    document.documentElement.style.setProperty(
      "--theme-text-inverted",
      currentTheme.colors.background,
    ); /* Para textos sobre fondos oscuros */
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
