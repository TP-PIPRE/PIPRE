import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../infrastructure/store/authStore';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isDocente = user?.role === 'docente';

  const navLinks = isDocente
    ? [
        { name: 'Dashboard', path: '/docente/dashboard' },
        { name: 'Métricas', path: '/docente/metricas' },
        { name: 'Retos', path: '/docente/retos' },
        { name: 'Estudiantes', path: '/docente/estudiantes' },
      ]
    : [
        { name: 'Inicio', path: '/' },
        { name: 'Cursos', path: '/cursos' },
        { name: 'Simulador', path: '/simulador' },
        { name: 'Resultados', path: '/resultados' },
        { name: 'Ranking', path: '/ranking' },
      ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 border-b border-border bg-bg/95 backdrop-blur-md z-[1001] flex items-stretch">
      {/* Left: Brand + Nav */}
      <div className="flex items-stretch">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2.5 px-5 border-r border-border hover:bg-surface/60 transition-colors"
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
                className={`flex items-center px-5 font-mono text-[11px] uppercase tracking-[0.15em] border-b-2 transition-colors
                  ${isActive
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-text-muted hover:text-text hover:bg-surface/40'}`}
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
        <div className="hidden sm:flex items-center gap-3 px-5 border-l border-border">
          <div className="flex flex-col items-end leading-tight">
            <span className="text-text text-[11px] font-semibold normal-case truncate max-w-[120px]">
              {user?.name || user?.email || 'Guest'}
            </span>
            <span className="text-text-muted text-[9px]">
              {isDocente ? 'Instructor' : 'Estudiante'}
            </span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center justify-center w-14 border-l border-border text-text-muted hover:text-primary hover:bg-surface/60 transition-colors"
          title="Cerrar sesión"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
        </button>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden flex items-center justify-center w-14 border-l border-border text-text-muted"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span className="material-symbols-outlined text-lg">
            {isMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile dropdown */}
      {isMenuOpen && (
        <div className="absolute top-14 left-0 w-full bg-bg border-b border-border md:hidden flex flex-col">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsMenuOpen(false)}
              className={`px-6 py-3 font-mono text-sm uppercase tracking-widest border-b border-border/30 transition-colors
                ${location.pathname === link.path
                  ? 'text-primary bg-primary/5'
                  : 'text-text-muted hover:text-text hover:bg-surface/40'}`}
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};

