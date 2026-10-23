import { useAuth } from "../../../application/hooks/useAuth";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, ChartNoAxesCombined, Home, LogOut, Menu, Palette, Trophy, UserRound, Users, FlaskConical, LayoutDashboard } from "lucide-react";
import { getAuthState } from "../../../infrastructure/store/authStore";
import { useThemeStore } from "../../../infrastructure/store/themeStore";
import { apiService } from "../../../infrastructure/api/apiService";
import { themes } from "../../../shared/constants/themes";
import { RobotIcon } from "./RobotIcon";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../../../components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "../../../components/ui/dropdown-menu";

export const Navbar = () => {
  const { user, isAuthenticated } = getAuthState();
  const { currentThemeName, setTheme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [profileInfo, setProfileInfo] = useState<{ level: number; stars: number } | null>(null);
  const isDocente = user?.role === "docente" || user?.role === "admin";
  const { logout } = useAuth();
  const [logoutError, setLogoutError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const roleName = user?.role === "admin" ? "Administrador" : isDocente ? "Docente" : "Estudiante";
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    let active = true;
    apiService.profile.get(user.id).then(p => {
      if (active) setProfileInfo({ level: p.level, stars: p.totalStars });
    }).catch(() => {});
    return () => { active = false; };
  }, [isAuthenticated, user?.id]);
  const navLinks = isDocente ? [
    { name: "Dashboard", path: "/docente/dashboard", icon: LayoutDashboard },
    { name: "Métricas", path: "/docente/metricas", icon: ChartNoAxesCombined },
    { name: "Retos", path: "/docente/retos", icon: FlaskConical },
    { name: "Estudiantes", path: "/docente/estudiantes", icon: Users },
  ] : [
    { name: "Inicio", path: "/", icon: Home },
    { name: "Simulador", path: "/simulador", icon: FlaskConical },
    { name: "Resultados", path: "/resultados", icon: ChartNoAxesCombined },
    { name: "Ranking", path: "/ranking", icon: Trophy },
  ];
  const handleLogout = async () => {
    setLoggingOut(true); setLogoutError("");
    try { await logout(); } catch { setLogoutError("No se pudo cerrar la sesión. Inténtalo de nuevo."); }
    finally { setLoggingOut(false); }
  };
  const themeSelect = (id: string) => (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="sr-only">Tema visual</label>
      <Palette size={18} aria-hidden="true" className="text-text-muted" />
      <select id={id} value={currentThemeName} onChange={e => setTheme(e.target.value as keyof typeof themes)} className="rounded-lg border border-border bg-surface px-2 py-2 text-sm w-full max-w-48">
        {Object.entries(themes).map(([key, theme]) => <option key={key} value={key}>{theme.name}</option>)}
      </select>
    </div>
  );
  const links = navLinks.map(({ name, path, icon: Icon }) => (
    <Link key={path} to={path} onClick={() => setIsSheetOpen(false)} className="nav-link" aria-current={(location.pathname === path || (path === "/simulador" && location.pathname.startsWith(path))) ? "page" : undefined}>
      <Icon size={18} aria-hidden="true" />{name}
    </Link>
  ));
  return (
    <header className="app-header">
      {logoutError && <p role="alert" className="absolute top-full right-4 bg-surface border border-danger text-danger p-3 rounded-lg">{logoutError}</p>}
      <div className="header-inner">
        <Link to={isDocente ? "/docente/dashboard" : "/"} className="brand" aria-label="PIPRE, inicio">
          <RobotIcon size={40} /><span><span className="brand-name">PIPRE</span><span className="brand-caption">Laboratorio de pensamiento lógico</span></span>
        </Link>
        <nav aria-label="Navegación principal" className="hidden xl:flex items-center gap-1">{links}</nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden xl:block">{themeSelect("desktop-theme")}</div>
          {isAuthenticated && <div className="hidden xl:block">
            <DropdownMenu>
              <DropdownMenuTrigger aria-label="Abrir menú de usuario" className="flex min-h-11 items-center gap-2 rounded-lg px-3 hover:bg-surface-brighter">
                <UserRound size={20} aria-hidden="true" /><span className="text-left max-w-36"><span className="block truncate text-sm font-semibold">{user?.name || user?.email?.split("@")[0]}</span><span className="block text-xs text-text-muted">{roleName}{!isDocente && profileInfo ? ` · Nivel ${profileInfo.level}` : ""}</span></span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-52">
                {!isDocente && <><DropdownMenuItem onClick={() => navigate("/perfil")}><UserRound aria-hidden="true" />Mi Perfil</DropdownMenuItem><DropdownMenuItem onClick={() => navigate("/perfil?tab=achievements")}><Trophy aria-hidden="true" />Logros</DropdownMenuItem><DropdownMenuSeparator /></>}
                <DropdownMenuItem disabled={loggingOut} onClick={handleLogout}><LogOut aria-hidden="true" />Cerrar sesión</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger aria-label="Abrir menú de navegación" className="xl:hidden icon-button"><Menu size={24} /></SheetTrigger>
            <SheetContent side="right" className="w-[min(340px,100vw)] p-0 overflow-y-auto">
              <SheetHeader className="p-6 border-b border-border"><SheetTitle className="flex items-center gap-2"><BookOpen size={22} aria-hidden="true" />PIPRE</SheetTitle><p className="text-sm text-text-muted">{roleName} · {user?.name || "Mi espacio"}</p></SheetHeader>
              <nav aria-label="Navegación móvil" className="flex flex-col gap-2 p-4">{links}{!isDocente && <Link to="/perfil" className="nav-link" onClick={() => setIsSheetOpen(false)}><UserRound size={18} aria-hidden="true" />Mi Perfil</Link>}</nav>
              <div className="p-6 border-t border-border"><p className="text-sm font-semibold mb-3">Apariencia</p>{themeSelect("mobile-theme")}</div>
              {isAuthenticated && <button disabled={loggingOut} onClick={handleLogout} className="nav-link mx-4 mb-6 text-danger"><LogOut size={18} aria-hidden="true" />Cerrar sesión</button>}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
