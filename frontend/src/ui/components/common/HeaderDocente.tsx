import React from "react";
import { Link } from "react-router-dom";

export const HeaderDocente = () => {
  return (
    <header className="bg-surface/80 backdrop-blur-[20px] sticky top-0 z-50 shadow-[0_40px_40px_-15px_rgba(39,48,54,0.06)]">
      <nav className="flex justify-between items-center w-full px-8 py-4 max-w-[1440px] mx-auto">
        {/* Logo y navegación */}
        <div className="hidden md:flex gap-6">
          <Link
            to="/docente/dashboard"
            className="text-blue-600 font-bold border-b-2 border-blue-600 pb-1 font-headline tracking-tight"
          >
            Dashboard
          </Link>
          <Link
            to="/docente/metricas"
            className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-300 font-headline tracking-tight"
          >
            Métricas
          </Link>
          <Link
            to="/docente/retos"
            className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-300 font-headline tracking-tight"
          >
            Retos
          </Link>
          <Link
            to="/docente/estudiantes"
            className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-300 font-headline tracking-tight"
          >
            Estudiantes
          </Link>
          <Link
            to="/docente/recursos"
            className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-300 font-headline tracking-tight"
          >
            Recursos
          </Link>
        </div>

        {/* Barra de búsqueda y perfil */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center bg-surface-container-low px-4 py-2 rounded-full">
            <span className="material-symbols-outlined text-outline">
              search
            </span>
            <input
              className="bg-transparent border-none focus:ring-0 text-sm w-48 font-body"
              placeholder="Buscar retos..."
              type="text"
            />
          </div>
          <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">
            notifications
          </button>
          <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">
            settings
          </button>
          <div className="flex items-center gap-3 ml-2 border-l border-outline-variant pl-6">
            <span className="text-sm font-bold text-on-surface hidden sm:block">
              Profe Alex
            </span>
            <img
              alt="Avatar del docente"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-primary-container"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWpUjW8GsxewBCWaIvMPBldWXWl1UZwdptpK2Quv65jQdKKSS11I9l6Fo8Zun8tdGQnCtE_J0eSjIDfi-DCIDQpPXFgHSxCl9-b2wU5v3DlAdh0ujI7lQXnaydwWhSkaQ1SBkIobESPMmAkCGr9DjQvUg2_JD2IOpxD5qZKCT1KByuBS2woq35w1-nojaDEiDH0O0ZRKKAKhuGxADoIjJhL_lEMUusy0ncx3-W5BY1EYX9MhNbM94nfwqDJ5fozCiGEgSGQeZyCVc"
            />
          </div>
        </div>
      </nav>
    </header>
  );
};
