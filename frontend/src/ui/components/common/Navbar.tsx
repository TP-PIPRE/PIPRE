import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  getAuthState,
  clearAuthState,
} from "../../../infrastructure/store/authStore";
import { useThemeStore } from "../../../infrastructure/store/themeStore";
import { themes } from "../../../shared/constants/themes";
import { RobotIcon } from "./RobotIcon";

export const Navbar: React.FC = () => {
  const { user, isAuthenticated } = getAuthState();
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
    console.log("Manejador de logout llamado desde Navbar.");
    clearAuthState();
    navigate("/login");
  };

  const handleThemeChange = (themeName: keyof typeof themes) => {
    setTheme(themeName);
    setIsThemeMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 border-b border-border/60 bg-bg/95 backdrop-blur-2xl z-[1001] flex items-stretch">
      {/* Left: Brand + Nav */}
      <div className="flex items-stretch flex-1">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-3 px-6 hover:bg-surface/40 transition-all group"
        >
          <div
            className="w-8 h-8 bg-primary text-bg flex items-center justify-center shrink-0 shadow-lg group-hover:rotate-12 transition-transform"
            style={{ borderRadius: "var(--theme-radius)" }}
          >
            <RobotIcon size={20} />
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-sm font-bold tracking-widest text-text">
              PIPRE
            </span>
            <span className="text-[8px] uppercase tracking-[0.3em] text-primary font-black">
              Industrial
            </span>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-stretch ml-4">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center px-6 text-[10px] font-bold uppercase tracking-[0.2em] relative transition-all active:scale-95 ${
                  isActive ? "text-primary" : "text-text-muted hover:text-text"
                }`}
              >
                {link.name}
                {isActive && (
                  <span className="absolute bottom-0 left-6 right-6 h-0.5 bg-primary rounded-full shadow-[0_0_10px_var(--primary)]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: User + Actions */}
      <div className="flex items-stretch px-2">
        {/* Theme Picker */}
        <div className="relative flex items-center h-full">
          <button
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-primary transition-all hover:bg-surface/60 rounded-full"
            title="Cambiar Tema"
          >
            <span className="material-symbols-outlined text-xl">palette</span>
          </button>

          {isThemeMenuOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-40 bg-surface border border-border p-2 shadow-2xl animate-scale-up z-[1100]"
              style={{ borderRadius: "var(--theme-radius)" }}
            >
              {(Object.keys(themes) as Array<keyof typeof themes>).map((t) => (
                <button
                  key={t}
                  onClick={() => handleThemeChange(t)}
                  className={`w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                    currentThemeName === t
                      ? "text-primary bg-primary/10"
                      : "text-text-muted hover:bg-surface-brighter"
                  }`}
                  style={{ borderRadius: "calc(var(--theme-radius) - 2px)" }}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Status */}
        {isAuthenticated && (
          <div className="hidden sm:flex items-center gap-4 px-6 border-x border-border/30">
            <div className="flex flex-col items-end leading-tight">
              <span className="text-[10px] font-bold text-text truncate max-w-[120px]">
                {user?.name || user?.email?.split("@")[0] || "Operador"}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-1 h-1 bg-success rounded-full animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-text-muted">
                  {isDocente ? "Instructor" : "Estudiante"}
                </span>
              </div>
            </div>
            <div
              className="w-8 h-8 bg-surface border border-border flex items-center justify-center overflow-hidden"
              style={{ borderRadius: "var(--theme-radius)" }}
            >
              <span className="material-symbols-outlined text-text-muted text-lg">
                person
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 px-2">
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-danger transition-all hover:bg-danger/10 rounded-full"
              title="Desconectar"
            >
              <span className="material-symbols-outlined text-xl">
                power_settings_new
              </span>
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden w-10 h-10 flex items-center justify-center text-text-muted hover:text-primary transition-all hover:bg-surface/60 rounded-full"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span className="material-symbols-outlined text-xl">
              {isMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {isMenuOpen && (
        <div className="absolute top-16 left-0 w-full bg-surface border-b border-border md:hidden flex flex-col p-4 gap-2 animate-fade-in">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsMenuOpen(false)}
              className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest transition-all ${
                location.pathname === link.path
                  ? "bg-primary/10 text-primary"
                  : "text-text-muted hover:bg-bg"
              }`}
              style={{ borderRadius: "var(--theme-radius)" }}
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};
