import { BrowserRouter as Router } from "react-router-dom";
import { AppRouter } from "./ui/router";
import { useThemeStore } from "./infrastructure/store/themeStore";
import { useEffect } from "react";

const App = () => {
  const { currentTheme } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    const c = currentTheme.colors;
    const r = currentTheme.borderRadius || "8px";

    // Our custom theme vars
    root.style.setProperty("--theme-bg", c.bg);
    root.style.setProperty("--theme-surface", c.surface);
    root.style.setProperty("--theme-surface-brighter", c.surfaceBrighter);
    root.style.setProperty("--theme-primary", c.primary);
    root.style.setProperty("--theme-primary-low", c.primaryLow);
    root.style.setProperty("--theme-primary-glow", c.primaryGlow);
    root.style.setProperty("--theme-border", c.border);
    root.style.setProperty("--theme-text", c.text);
    root.style.setProperty("--theme-text-muted", c.textMuted);
    root.style.setProperty("--theme-text-inverted", c.textInverted);
    root.style.setProperty("--theme-accent", c.accent);
    root.style.setProperty("--theme-success", c.success);
    root.style.setProperty("--theme-danger", c.danger);
    root.style.setProperty("--robot-c1", c.robotC1);
    root.style.setProperty("--robot-c2", c.robotC2);
    root.style.setProperty("--theme-radius", r);

    // shadcn/ui CSS variables — mapped from our theme
    root.style.setProperty("--background", c.bg);
    root.style.setProperty("--foreground", c.text);
    root.style.setProperty("--card", c.surface);
    root.style.setProperty("--card-foreground", c.text);
    root.style.setProperty("--popover", c.surface);
    root.style.setProperty("--popover-foreground", c.text);
    root.style.setProperty("--primary", c.primary);
    root.style.setProperty("--primary-foreground", c.textInverted);
    root.style.setProperty("--secondary", c.surfaceBrighter);
    root.style.setProperty("--secondary-foreground", c.text);
    root.style.setProperty("--muted", c.surface);
    root.style.setProperty("--muted-foreground", c.textMuted);
    root.style.setProperty("--accent", c.accent);
    root.style.setProperty("--accent-foreground", c.textInverted);
    root.style.setProperty("--destructive", c.danger);
    root.style.setProperty("--destructive-foreground", c.textInverted);
    root.style.setProperty("--border", c.border);
    root.style.setProperty("--input", c.border);
    root.style.setProperty("--ring", c.primary);
    root.style.setProperty("--radius", r);
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
