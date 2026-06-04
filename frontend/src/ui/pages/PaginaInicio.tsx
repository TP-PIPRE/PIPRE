import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaRobot,
  FaCode,
  FaGamepad,
  FaMicrochip,
  FaCheckCircle,
} from "react-icons/fa";
import { apiService } from "../../infrastructure/api/apiService";
import type { Course } from "../../shared/types/Course";
import { Modal } from "../components/common/Modal";

const CATEGORIES = [
  { key: "all", label: "Todos", icon: null },
  { key: "curso", label: "Cursos", icon: FaRobot },
  { key: "simulador", label: "Simuladores", icon: FaGamepad },
];

const DEMO_RETOS: Course[] = [
  {
    id: "demo-1",
    nombre: "Introducción a la Robótica",
    descripcion:
      "Aprende los fundamentos de la robótica y construye tu primer robot virtual.",
    imagen: "",
    tipo: "curso",
    challenges: [],
  },
  {
    id: "demo-2",
    nombre: "Navegación Autónoma",
    descripcion:
      "Programa un bot para navegar un laberinto usando sensores ultrasónicos.",
    imagen: "",
    tipo: "simulador",
    challenges: [],
  },
  {
    id: "demo-3",
    nombre: "Brazo Robótico v2",
    descripcion:
      "Controla una garra mecánica para clasificar objetos por color.",
    imagen: "",
    tipo: "simulador",
    challenges: [],
  },
];

export const PaginaInicio = () => {
  const navigate = useNavigate();
  const [cursos, setCursos] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedReto, setSelectedReto] = useState<Course | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await apiService.courses.getAll();
        const mapped: Course[] = data.map((c) => ({
          id: c.idCourse,
          nombre: c.name,
          descripcion: "Explora los fundamentos de este módulo industrial.",
          imagen: "",
          tipo: "curso",
          challenges: [],
        }));
        setCursos(mapped);
      } catch {
        setCursos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const allItems = [...DEMO_RETOS, ...cursos];
  const filteredItems =
    activeCategory === "all"
      ? allItems
      : allItems.filter((item) => item.tipo === activeCategory);

  return (
    <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-8 pt-[6rem] pb-24 animate-fade-in-soft">
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Ecosistema de <span className="text-primary/70">Aprendizaje</span>
        </h1>
        <p className="text-text-muted/60 text-xs font-medium max-w-lg leading-relaxed">
          Plataforma educativa modular para la formación técnica en robótica
          industrial y automatización.
        </p>
      </div>

      {/* BRIEFING MODAL — uses shared component */}
      <Modal
        isOpen={selectedReto !== null}
        onClose={() => setSelectedReto(null)}
        maxWidth="max-w-3xl"
      >
        {selectedReto && (
          <div className="flex flex-col">
            {/* Mission Hero Header */}
            <div className="relative h-48 bg-primary/10 overflow-hidden flex items-center justify-center border-b border-border/10">
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "radial-gradient(var(--theme-primary) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />
              </div>
              <div className="relative text-center px-10">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.5em] mb-4 block animate-fade-in-soft">
                  Protocolo de Inicio
                </span>
                <h2 className="text-4xl font-bold tracking-tight animate-scale-up-soft">
                  {selectedReto.nombre}
                </h2>
              </div>
            </div>

            <div className="p-10 space-y-12">
              {/* Mission Objective */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted/60 flex items-center gap-2">
                  <span className="w-8 h-[1px] bg-primary/30" /> Objetivo
                  Operacional
                </h3>
                <p className="text-lg text-text-muted/90 leading-relaxed font-medium">
                  {selectedReto.descripcion}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Hardware Requirements */}
                <div className="p-6 bg-surface/30 rounded-2xl border border-border/10 space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted/60 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FaMicrochip className="text-primary text-sm" />
                    </div>
                    Configuración de Hardware
                  </h3>
                  <ul className="space-y-4">
                    {[
                      "Servomotores de Torque Alto",
                      "Sensor Ultrasónico HC-SR04",
                      "Microcontrolador PIPRE-X1",
                    ].map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 text-sm font-semibold text-text/80"
                      >
                        <FaCheckCircle className="text-success text-[12px] shrink-0" />{" "}
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Software Protocols */}
                <div className="p-6 bg-surface/30 rounded-2xl border border-border/10 space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted/60 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FaCode className="text-primary text-sm" />
                    </div>
                    Arquitectura de Software
                  </h3>
                  <ul className="space-y-4">
                    {[
                      "Inicialización de Puertos I/O",
                      "Bucle de Control PID",
                      "Sincronización de Servos",
                    ].map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 text-sm font-semibold text-text/80"
                      >
                        <FaCheckCircle className="text-success text-[12px] shrink-0" />{" "}
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button
                  onClick={() => setSelectedReto(null)}
                  className="flex-1 btn-secondary text-[11px] font-black tracking-widest py-5"
                >
                  CANCELAR MISIÓN
                </button>
                <button
                  onClick={() => navigate("/simulador")}
                  className="flex-[2] btn-premium py-5 text-[11px] font-black tracking-[0.3em] shadow-2xl shadow-primary/20"
                >
                  INICIAR SECUENCIA →
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Category filters */}
      <div className="flex gap-3 mb-12 flex-wrap">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-2.5 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 border ${
                isActive
                  ? "bg-primary text-bg border-primary shadow-lg shadow-primary/10"
                  : "bg-surface/40 border-border/20 text-text-muted/60 hover:border-primary/30 hover:text-text"
              }`}
              style={{ borderRadius: "var(--theme-radius)" }}
            >
              {Icon && (
                <Icon
                  className={isActive ? "animate-bounce-soft" : "opacity-40"}
                />
              )}
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Grid of cards */}
      {loading ? (
        <div className="py-32 flex flex-col items-center gap-6 opacity-30">
          <div className="w-10 h-10 border border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] font-bold">
            Sincronizando Nodo...
          </span>
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              onClick={() => setSelectedReto(item)}
              className="group bg-surface/30 border border-border/10 flex flex-col cursor-pointer transition-all duration-700 hover:border-primary/20 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden"
              style={{ borderRadius: "var(--theme-radius)" }}
            >
              {/* Image */}
              <div className="aspect-video w-full overflow-hidden relative bg-bg/40">
                {item.imagen ? (
                  <img
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000"
                    src={item.imagen}
                    alt={item.nombre}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary/10 group-hover:text-primary/30 transition-colors duration-500">
                    <FaRobot className="text-5xl group-hover:scale-110 transition-transform" />
                  </div>
                )}
                {/* Type badge */}
                <span
                  className="absolute top-5 left-5 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.2em] bg-bg/80 backdrop-blur-md border border-border/20 text-primary/80"
                  style={{ borderRadius: "var(--theme-radius)" }}
                >
                  {item.tipo || "módulo"}
                </span>
              </div>

              {/* Content */}
              <div className="p-8 flex-1 flex flex-col gap-5">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-text group-hover:text-primary/80 transition-colors duration-500 leading-tight flex-1">
                    {item.nombre}
                  </h3>
                </div>

                <p className="text-xs text-text-muted/50 leading-relaxed line-clamp-2 flex-1 font-medium">
                  {item.descripcion}
                </p>

                <div className="pt-6 border-t border-border/5 flex justify-between items-center">
                  <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                    <div className="w-1.5 h-1.5 bg-success/60 rounded-full group-hover:bg-success" />
                    <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">
                      Disponible
                    </span>
                  </div>
                  <button className="text-[10px] font-black text-primary/70 uppercase tracking-[0.2em] group-hover:translate-x-1 transition-transform">
                    ACCEDER →
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
};
