import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  getAuthState,
  clearAuthState,
} from "../../../infrastructure/store/authStore";
import { useThemeStore } from "../../../infrastructure/store/themeStore";
import { themes } from "../../../shared/constants/themes";
import { RobotIcon } from "./RobotIcon";
import { BsPaletteFill, BsPersonFill, BsPower, BsList } from "react-icons/bs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../../components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "../../../components/ui/dropdown-menu";

const themeIcons: Record<string, string> = {
  candyHarmony: "\u2728",
  dark: "\uD83C\uDFAE",
  light: "\uD83C\uDF1F",
};

export const Navbar: React.FC = () => {
  const { user, isAuthenticated } = getAuthState();
  const { currentThemeName, setTheme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const isDocente = user?.role === "docente";

  const navLinks = isDocente
    ? [
        { name: "Dashboard", path: "/docente/dashboard" },
        { name: "M\u00e9tricas", path: "/docente/metricas" },
        { name: "Retos", path: "/docente/retos" },
        { name: "Estudiantes", path: "/docente/estudiantes" },
        { name: "Biblioteca", path: "/biblioteca" },
      ]
    : [
        { name: "Inicio", path: "/" },
        { name: "Simulador", path: "/simulador" },
        { name: "Resultados", path: "/resultados" },
        { name: "Ranking", path: "/ranking" },
        { name: "Biblioteca", path: "/biblioteca" },
      ];

  const handleLogout = () => {
    clearAuthState();
    navigate("/login");
  };

  const currentThemeDisplay = themes[currentThemeName]?.name || currentThemeName;

  return (
    <header className="fixed top-0 left-0 right-0 h-12 border-b bg-background/95 backdrop-blur-2xl z-[1001] flex items-stretch">
      <div className="flex items-stretch flex-1 max-w-[1920px] mx-auto w-full px-2">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 hover:opacity-80 transition-all group shrink-0"
        >
          <div className="w-7 h-7 bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow group-hover:scale-110 transition-transform rounded-md">
            <RobotIcon size={16} />
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-xs font-bold tracking-widest text-foreground">
              PIPRE
            </span>
            <span className="text-[7px] uppercase tracking-[0.25em] text-primary font-black leading-none">
              Industrial
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-stretch ml-3">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center px-3 text-[9px] font-bold uppercase tracking-[0.15em] relative transition-all hover:opacity-100 ${
                  isActive
                    ? "text-primary opacity-100"
                    : "text-muted-foreground/60 hover:text-foreground"
                }`}
              >
                {link.name}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-primary rounded-full shadow-[0_0_6px_var(--primary)]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-0 ml-auto">
          <div className="hidden md:flex items-center">
            <Select
              value={currentThemeName}
              onValueChange={(v) => setTheme(v as keyof typeof themes)}
            >
              <SelectTrigger className="h-7 w-auto min-w-0 border-0 bg-transparent hover:bg-muted/30 text-[10px] font-medium gap-1 px-2 [&>svg]:text-muted-foreground [&>svg]:h-3 [&>svg]:w-3">
                <BsPaletteFill className="h-3 w-3 shrink-0 text-muted-foreground" />
                <SelectValue placeholder={currentThemeDisplay} />
              </SelectTrigger>
              <SelectContent className="min-w-[140px]">
                {(Object.entries(themes) as [keyof typeof themes, typeof themes[keyof typeof themes]][]).map(([key, theme]) => (
                  <SelectItem key={key} value={key} className="text-[10px] py-1">
                    {themeIcons[key] || "\u2728"} {theme.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isAuthenticated && (
            <div className="hidden md:flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1.5 px-2 py-1 mx-0.5 rounded-md hover:bg-muted/30 transition-colors cursor-pointer">
                  <div className="w-6 h-6 bg-muted border border-border rounded-md flex items-center justify-center overflow-hidden">
                    <BsPersonFill className="text-muted-foreground text-xs" />
                  </div>
                  <div className="flex flex-col items-start leading-tight max-w-[80px]">
                    <span className="text-[9px] font-semibold text-foreground truncate w-full">
                      {user?.name || user?.email?.split("@")[0] || "Operador"}
                    </span>
                    <span className="text-[7px] font-bold uppercase tracking-wider text-muted-foreground leading-none">
                      {isDocente ? "Instructor" : "Estudiante"}
                    </span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[140px] p-1">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                      {user?.name || "Usuario"}
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-[10px] text-destructive font-medium cursor-pointer px-2 py-1"
                  >
                    <BsPower className="h-3 w-3 mr-1.5" />
                    Cerrar sesi\u00f3n
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="md:hidden w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-destructive/10"
              title="Desconectar"
            >
              <BsPower className="text-sm" />
            </button>
          )}

          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger className="md:hidden w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/30 cursor-pointer">
              <BsList className="text-lg" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[260px] p-0">
              <SheetHeader className="p-3 border-b">
                <SheetTitle className="flex items-center gap-2 text-xs">
                  <RobotIcon size={16} />
                  PIPRE
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col p-1.5">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsSheetOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider rounded-md transition-all ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                      }`}
                    >
                      {link.name}
                    </Link>
                  );
                })}
                <div className="border-t my-1.5" />
                <div className="px-3 py-2">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Tema</span>
                  <Select
                    value={currentThemeName}
                    onValueChange={(v) => {
                      setTheme(v as keyof typeof themes);
                      setIsSheetOpen(false);
                    }}
                  >
                    <SelectTrigger className="w-full h-7 text-[10px]">
                      <SelectValue placeholder={currentThemeDisplay} />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(themes) as [keyof typeof themes, typeof themes[keyof typeof themes]][]).map(([key, theme]) => (
                        <SelectItem key={key} value={key} className="text-[10px] py-1">
                          {themeIcons[key] || "\u2728"} {theme.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
