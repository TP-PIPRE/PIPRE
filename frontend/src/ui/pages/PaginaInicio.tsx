import { useEffect, useState } from "react";
import { FaRobot, FaCode, FaGamepad } from "react-icons/fa";
import { getCourses } from "../../infrastructure/adapters/http/CourseApiAdapter";
import type { Course } from "../../domain/models/Course";

const CATEGORIES = [
  { key: "all", label: "Todos", icon: null },
  { key: "robotica", label: "Robótica", icon: FaRobot },
  { key: "logica", label: "Lógica", icon: FaCode },
  { key: "simulacion", label: "Simulación", icon: FaGamepad },
];

const DEMO_RETOS: Course[] = [
  {
    id: "demo-1",
    nombre: "Introducción a la Robótica",
    descripcion: "Aprende los fundamentos de la robótica y construye tu primer robot virtual.",
    imagen: "https://lh3.googleusercontent.com/aida-public/AB6AXuAe-fnR0Qj_GfTf88xQ4Dms2aLibPWG91i_YhOmCqlpJrEoJA7WZCCjs96HQT8PGA96-7Yv_O_k-AL9Iu06JYXjHRmW6peg9e2LCwKi96K5VrPlkyBaBIb1h8GinhlSdQla8o4zSykiDZ8L_KaJn3r8kCuJxXoyuugFmv3MkBGPhkHVS1zjwQlH00Zg275MmwUpxh1HeGWnopxYuy4TJZLfR6a6XNMp3eAvjnpy9HjakYM_2s1fMPb47DAsDJDoR8rod6BaDoc6_KM=w600-h400",
    tipo: "curso",
  },
  {
    id: "demo-2",
    nombre: "Navegación Autónoma",
    descripcion: "Programa un bot para navegar un laberinto usando sensores ultrasónicos.",
    imagen: "",
    tipo: "reto",
  },
  {
    id: "demo-3",
    nombre: "Brazo Robótico v2",
    descripcion: "Controla una garra mecánica para clasificar objetos por color.",
    imagen: "",
    tipo: "reto",
  },
];

export const PaginaInicio = () => {
  const [cursos, setCursos] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await getCourses();
        setCursos(data);
      } catch {
        // fallback to demo data if API fails
        setCursos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const allItems = [...DEMO_RETOS, ...cursos];

  return (
    <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-6 pt-[4rem] pb-16">
      {/* Page Header — compact, not a giant hero */}
      <div className="mb-8 pt-4">
        <h1 className="text-2xl font-mono font-bold tracking-tight mb-1">
          Plataforma de <span className="text-primary">Retos</span>
        </h1>
        <p className="text-text-muted text-sm max-w-lg">
          Explora los retos y cursos disponibles. Instala hardware, programa lógica y pon a prueba tu bot.
        </p>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider border transition-colors
                ${isActive
                  ? "border-primary text-primary bg-primary/5"
                  : "border-border text-text-muted hover:text-text hover:border-text-muted"}`}
            >
              {Icon && <Icon className="text-[10px]" />}
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Grid of cards */}
      {loading ? (
        <div className="py-24 flex justify-center">
          <span className="font-mono text-xs text-text-muted animate-pulse">
            Cargando módulos...
          </span>
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {allItems.map((item, idx) => (
            <article
              key={item.id}
              className="panel-border bg-surface/40 flex flex-col group cursor-pointer hover:bg-surface/60 transition-colors"
            >
              {/* Image */}
              <div className="aspect-video w-full overflow-hidden relative bg-bg">
                {item.imagen ? (
                  <img
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-90 transition-opacity"
                    src={item.imagen}
                    alt={item.nombre}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted/30">
                    <FaRobot className="text-4xl" />
                  </div>
                )}
                {/* Type badge */}
                <span className="absolute top-3 left-3 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-bg/80 border border-border text-text-muted">
                  {item.tipo || "módulo"}
                </span>
                {/* Index label */}
                <span className="absolute top-3 right-3 text-[9px] font-mono text-text-muted/50">
                  #{String(idx + 1).padStart(2, "0")}
                </span>
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col gap-2">
                <h3 className="text-sm font-mono font-bold text-text group-hover:text-primary transition-colors leading-snug">
                  {item.nombre}
                </h3>
                <p className="text-xs text-text-muted leading-relaxed line-clamp-2 flex-1">
                  {item.descripcion}
                </p>
                <div className="pt-3 border-t border-border/40 flex justify-between items-center">
                  <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
                    Disponible
                  </span>
                  <span className="text-[10px] font-mono text-primary">
                    Iniciar →
                  </span>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
};
