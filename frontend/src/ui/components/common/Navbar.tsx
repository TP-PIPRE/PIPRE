import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../infrastructure/store/authStore";
import { useThemeStore } from "../../../infrastructure/store/themeStore";
import { themes } from "../../../shared/constants/themes";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { currentThemeName, setTheme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const isDocente = user?.role === "docente";

  const navLinks = isDocente
    ? [
        { name: "Dashboard", path: "/docente/dashboard" },
        { name: "Métricas", path: "/docente/metricas" },
        { name: "Retos", path: "/docente/retos" },
        { name: "Estudiantes", path: "/docente/estudiantes" },
      ]
    : [
        { name: "Inicio", path: "/" },
        { name: "Cursos", path: "/cursos" },
        { name: "Simulador", path: "/simulador" },
        { name: "Resultados", path: "/resultados" },
        { name: "Ranking", path: "/ranking" },
      ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleThemeChange = (themeName: keyof typeof themes) => {
    setTheme(themeName);
    setIsThemeMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 border-b border-border bg-bg/95 backdrop-blur-md z-[1001] flex items-stretch">
      {/* Left: Brand + Nav */}
      <div className="flex items-stretch">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2.5 px-5 border-r border-border hover:bg-surface/60"
          style={{ transition: "background-color 0.3s ease" }}
        >
          <div className="w-7 h-7 bg-primary flex items-center justify-center font-mono font-black text-bg text-base shrink-0">
            P
          </div>
          <span className="font-mono text-xs font-bold tracking-[0.15em] text-text hidden sm:block">
            PIPRE
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-stretch">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center px-5 font-mono text-[11px] uppercase tracking-[0.15em] border-b-2`}
                style={{
                  borderColor: isActive ? "var(--primary)" : "transparent",
                  color: isActive ? "var(--primary)" : "var(--text-muted)",
                  backgroundColor: isActive
                    ? "rgba(var(--primary-rgb), 0.05)"
                    : "transparent",
                  transition:
                    "border-color 0.3s ease, color 0.3s ease, background-color 0.3s ease",
                }}
                onMouseOver={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "var(--text)";
                    e.currentTarget.style.backgroundColor =
                      "rgba(var(--surface-rgb), 0.4)";
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "var(--text-muted)";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: User + Actions */}
      <div className="flex items-stretch font-mono text-[10px] uppercase tracking-[0.12em]">
        {/* User info */}
        <div className="hidden sm:flex items-center gap-3 px-5 border-l border-border relative">
          <div className="flex flex-col items-end leading-tight">
            <span className="text-text text-[11px] font-semibold normal-case truncate max-w-[120px]">
              {user?.name || user?.email || "Guest"}
            </span>
            <span className="text-text-muted text-[9px]">
              {isDocente ? "Instructor" : "Estudiante"}
            </span>
          </div>

          {/* Menú de temas */}
          <div className="relative">
            <button
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="flex items-center justify-center w-10 h-10 text-text-muted hover:text-primary"
              style={{
                backgroundColor: "transparent",
                transition: "color 0.3s ease, background-color 0.3s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = "var(--primary)";
                e.currentTarget.style.backgroundColor =
                  "rgba(var(--surface-rgb), 0.6)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = "var(--text-muted)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              title="Cambiar tema"
            >
              <span className="material-symbols-outlined text-lg">palette</span>
            </button>
            {isThemeMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-32 bg-bg rounded-md shadow-lg border border-border z-50"
                style={{ transition: "opacity 0.3s ease, transform 0.3s ease" }}
              >
                <div className="p-1">
                  {(Object.keys(themes) as Array<keyof typeof themes>).map(
                    (themeName) => (
                      <button
                        key={themeName}
                        onClick={() => handleThemeChange(themeName)}
                        className={`block w-full text-left p-2 text-[11px] uppercase tracking-[0.1em] rounded`}
                        style={{
                          backgroundColor:
                            currentThemeName === themeName
                              ? "rgba(var(--primary-rgb), 0.1)"
                              : "transparent",
                          color:
                            currentThemeName === themeName
                              ? "var(--primary)"
                              : "var(--text-muted)",
                          transition:
                            "background-color 0.2s ease, color 0.2s ease",
                        }}
                        onMouseOver={(e) => {
                          if (currentThemeName !== themeName) {
                            e.currentTarget.style.backgroundColor =
                              "rgba(var(--surface-rgb), 0.4)";
                          }
                        }}
                        onMouseOut={(e) => {
                          if (currentThemeName !== themeName) {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }
                        }}
                      >
                        {themeName}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center justify-center w-14 border-l border-border text-text-muted"
          style={{
            transition: "color 0.3s ease, background-color 0.3s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = "var(--primary)";
            e.currentTarget.style.backgroundColor =
              "rgba(var(--surface-rgb), 0.6)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = "var(--text-muted)";
            e.currentTarget.style.backgroundColor = "transparent";
          }}
          title="Cerrar sesión"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
        </button>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden flex items-center justify-center w-14 border-l border-border text-text-muted"
          style={{ transition: "color 0.3s ease, background-color 0.3s ease" }}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          onMouseOver={(e) => {
            e.currentTarget.style.color = "var(--primary)";
            e.currentTarget.style.backgroundColor =
              "rgba(var(--surface-rgb), 0.6)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = "var(--text-muted)";
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <span className="material-symbols-outlined text-lg">
            {isMenuOpen ? "close" : "menu"}
          </span>
        </button>
      </div>

      {/* Mobile dropdown */}
      {isMenuOpen && (
        <div
          className="absolute top-14 left-0 w-full bg-bg border-b border-border md:hidden flex flex-col"
          style={{ transition: "transform 0.3s ease" }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsMenuOpen(false)}
              className={`px-6 py-3 font-mono text-sm uppercase tracking-widest border-b border-border/30`}
              style={{
                color:
                  location.pathname === link.path
                    ? "var(--primary)"
                    : "var(--text-muted)",
                backgroundColor:
                  location.pathname === link.path
                    ? "rgba(var(--primary-rgb), 0.05)"
                    : "transparent",
                transition: "color 0.3s ease, background-color 0.3s ease",
              }}
              onMouseOver={(e) => {
                if (location.pathname !== link.path) {
                  e.currentTarget.style.color = "var(--text)";
                  e.currentTarget.style.backgroundColor =
                    "rgba(var(--surface-rgb), 0.4)";
                }
              }}
              onMouseOut={(e) => {
                if (location.pathname !== link.path) {
                  e.currentTarget.style.color = "var(--text-muted)";
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};
