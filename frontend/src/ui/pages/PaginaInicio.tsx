import { useEffect, useState } from "react";
import { FaRobot, FaCode, FaGamepad, FaSearch } from "react-icons/fa";
import { getCourses } from "../../infrastructure/adapters/http/CourseApiAdapter";
import type { Course } from "../../domain/models/Course";

export const PaginaInicio = () => {
  const [cursos, setCursos] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await getCourses();
        setCursos(data);
      } catch (error) {
        console.error("Error al cargar cursos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const cursoEjemplo: Course = {
    id: "1",
    nombre: "Introducción a la Robótica",
    descripcion:
      "Aprende los fundamentos de la robótica y construye tu primer robot virtual.",
    imagen:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAe-fnR0Qj_GfTf88xQ4Dms2aLibPWG91i_YhOmCqlpJrEoJA7WZCCjs96HQT8PGA96-7Yv_O_k-AL9Iu06JYXjHRmW6peg9e2LCwKi96K5VrPlkyBaBIb1h8GinhlSdQla8o4zSykiDZ8L_KaJn3r8kCuJxXoyuugFmv3MkBGPhkHVS1zjwQlH00Zg275MmwUpxh1HeGWnopxYuy4TJZLfR6a6XNMp3eAvjnpy9HjakYM_2s1fMPb47DAsDJDoR8rod6BaDoc6_KM=w600-h400",
    tipo: "curso",
  };

  return (
    <main className="pt-32 pb-40 px-6 max-w-7xl mx-auto min-h-screen bg-surface text-on-surface">
      {/* Hero Section */}
      <header className="text-center mb-16 space-y-8">
        <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tight drop-shadow-sm">
          ¡Explora y{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]">
            Aprende Robótica!
          </span>
        </h1>
        <div className="max-w-2xl mx-auto relative group">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-primary">
            <FaSearch className="text-xl" />
          </div>
          <input
            className="w-full pl-16 pr-8 py-6 bg-surface-container-lowest text-on-surface text-lg rounded-full shadow-xl shadow-secondary/5 border-none focus:ring-2 focus:ring-tertiary transition-all outline-none placeholder:text-outline-variant"
            placeholder="¿Qué tema de robótica quieres explorar hoy?"
            type="text"
          />
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <button className="flex items-center gap-3 px-8 py-4 bg-secondary-container text-on-secondary-container rounded-full font-bold shadow-md hover:scale-105 transition-all">
            <FaRobot className="text-xl" />
            Robótica Básica
          </button>
          <button className="flex items-center gap-3 px-8 py-4 bg-tertiary-container text-on-tertiary-container rounded-full font-bold shadow-md hover:scale-105 transition-all">
            <FaCode className="text-xl" />
            Programación
          </button>
          <button className="flex items-center gap-3 px-8 py-4 bg-surface-container-highest text-primary font-bold rounded-full shadow-md hover:scale-105 transition-all">
            <FaGamepad className="text-xl" />
            Simuladores
          </button>
        </div>
      </header>

      {/* Content Grid */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Curso de ejemplo */}
        <div className="md:col-span-8 bg-surface-container-lowest rounded-xl p-2 shadow-xl hover:-translate-y-2 transition-transform duration-300 group cursor-pointer relative overflow-hidden">
          <div className="aspect-video w-full overflow-hidden rounded-lg relative">
            <img
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              src={cursoEjemplo.imagen}
              alt={cursoEjemplo.nombre}
              onError={(e) => {
                e.currentTarget.src =
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuAe-fnR0Qj_GfTf88xQ4Dms2aLibPWG91i_YhOmCqlpJrEoJA7WZCCjs96HQT8PGA96-7Yv_O_k-AL9Iu06JYXjHRmW6peg9e2LCwKi96K5VrPlkyBaBIb1h8GinhlSdQla8o4zSykiDZ8L_KaJn3r8kCuJxXoyuugFmv3MkBGPhkHVS1zjwQlH00Zg275MmwUpxh1HeGWnopxYuy4TJZLfR6a6XNMp3eAvjnpy9HjakYM_2s1fMPb47DAsDJDoR8rod6BaDoc6_KM=w600-h400";
              }}
            />
            <div className="absolute top-6 left-6 bg-primary/90 text-white p-3 rounded-2xl shadow-lg backdrop-blur-md">
              <FaRobot className="text-3xl" />
            </div>
          </div>
          <div className="p-8 flex justify-between items-end">
            <div className="space-y-2">
              <span className="text-secondary font-bold uppercase tracking-widest text-xs">
                {cursoEjemplo.tipo}
              </span>
              <h3 className="text-3xl font-headline font-bold text-on-surface">
                {cursoEjemplo.nombre}
              </h3>
              <p className="text-on-surface-variant max-w-md">
                {cursoEjemplo.descripcion}
              </p>
            </div>
            <button className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--primary-container)] text-on-primary-fixed-variant px-8 py-4 rounded-full font-bold shadow-lg hover:scale-110 active:scale-95 transition-all">
              ¡Explorar!
            </button>
          </div>
        </div>

        {/* Cursos cargados desde la API */}
        {loading ? (
          <p className="md:col-span-12 text-center text-on-surface-variant">
            Cargando cursos...
          </p>
        ) : (
          cursos.map((curso: Course) => (
            <div
              key={curso.id}
              className="md:col-span-4 bg-surface-container-lowest rounded-xl p-2 shadow-xl hover:-translate-y-2 transition-transform duration-300 group cursor-pointer"
            >
              <div className="aspect-video w-full overflow-hidden rounded-lg relative">
                <img
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  src={
                    curso.imagen ||
                    "https://via.placeholder.com/600x400/0077b6/ffffff?text=Robotica"
                  }
                  alt={curso.nombre}
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/600x400/0077b6/ffffff?text=Robotica";
                  }}
                />
                <div className="absolute top-6 left-6 bg-primary/90 text-white p-3 rounded-2xl shadow-lg backdrop-blur-md">
                  <FaRobot className="text-xl" />
                </div>
              </div>
              <div className="p-6 space-y-2">
                <h3 className="text-xl font-headline font-bold text-on-surface">
                  {curso.nombre}
                </h3>
                <p className="text-on-surface-variant text-sm">
                  {curso.descripcion}
                </p>
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
};
