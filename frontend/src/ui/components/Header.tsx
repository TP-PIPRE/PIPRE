import { Link } from "react-router-dom";

export const Header = () => {
  return (
    <header className="fixed top-0 w-full z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-[20px] shadow-[0_20px_40px_rgba(39,48,52,0.06)]">
      <div className="flex justify-between items-center h-20 px-8 w-full max-w-screen-2xl mx-auto">
        {/* Brand Logo */}
        <div className="flex items-center gap-2 active:scale-95 transform transition-transform duration-200 cursor-pointer">
          <span className="text-2xl font-black tracking-tighter text-pink-600 dark:text-pink-400">
            PIPRE
          </span>
        </div>

        {/* Navigation Desktop */}
        <nav className="hidden md:flex items-center gap-8 font-['Plus_Jakarta_Sans'] font-medium tracking-tight">
          <Link
            className="text-pink-600 dark:text-pink-400 font-bold border-b-2 border-pink-500 pb-1 active:scale-95 transform transition-transform duration-200"
            to="/"
          >
            Inicio
          </Link>
          <Link
            className="text-slate-600 dark:text-slate-400 hover:text-pink-500 transition-colors active:scale-95 transform transition-transform duration-200"
            to="/simulador"
          >
            Simulador
          </Link>
          <a
            className="text-slate-600 dark:text-slate-400 hover:text-pink-500 transition-colors active:scale-95 transform transition-transform duration-200"
            href="#"
          >
            Cursos
          </a>
          <a
            className="text-slate-600 dark:text-slate-400 hover:text-pink-500 transition-colors active:scale-95 transform transition-transform duration-200"
            href="#"
          >
            Biblioteca
          </a>
        </nav>

        {/* Search and Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center bg-surface-container-low px-4 py-2 rounded-full border-none outline-none group focus-within:ring-2 ring-secondary/20 transition-all">
            <span className="material-symbols-outlined text-outline-variant text-lg">
              search
            </span>
            <input
              className="bg-transparent border-none focus:ring-0 text-sm ml-2 w-48 text-on-surface-variant font-body"
              placeholder="Buscar inspiración..."
              type="text"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-pink-50/50 dark:hover:bg-pink-900/20 rounded-full transition-all duration-300 active:scale-95 transform">
              <span className="material-symbols-outlined text-on-surface-variant">
                notifications
              </span>
            </button>
            <div className="h-10 w-10 rounded-full bg-secondary-container p-0.5 overflow-hidden active:scale-95 transform transition-transform duration-200 cursor-pointer shadow-sm">
              <img
                alt="User avatar"
                className="w-full h-full object-cover rounded-full"
                src="https://via.placeholder.com/40"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
