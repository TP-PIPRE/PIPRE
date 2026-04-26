import React, { useEffect, useState } from "react";
import { apiService } from "../../infrastructure/api/apiService";

const MOCK_COURSES = [
  { idCourse: "1", name: "Robótica Nivel 1: Fundamentos (Local)", description: "Aprende las bases de la robótica y electrónica." },
  { idCourse: "2", name: "Programación de Microcontroladores (Local)", description: "Domina el lenguaje C++ para control de hardware." },
];

export const CursosPage: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        const data = await apiService.courses.getAll();
        if (data && data.length > 0) {
          setCourses(data);
        } else {
          setCourses(MOCK_COURSES);
        }
        setError(null);
      } catch (err) {
        console.error("Error fetching courses, using fallback:", err);
        setCourses(MOCK_COURSES);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center font-mono text-sm" style={{ color: "var(--text-muted)" }}>
        <span className="animate-pulse">Cargando módulos de aprendizaje...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <span className="material-symbols-outlined text-4xl mb-4" style={{ color: "var(--accent)" }}>error</span>
        <p className="font-mono text-sm mb-4" style={{ color: "var(--text)" }}>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="btn-secondary text-xs uppercase tracking-widest"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <main
      className="flex-1 p-6 max-w-7xl mx-auto w-full"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <header className="mb-10">
        <h1
          className="text-xl font-mono font-bold tracking-tight mb-2"
          style={{ color: "var(--text)" }}
        >
          Mis Cursos
        </h1>
        <p
          className="text-sm font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          Explora tus módulos, lecciones y actividades de simulación.
        </p>
      </header>

      {courses.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border">
          <p className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
            No tienes cursos asignados actualmente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {courses.map((course) => (
            <div
              key={course.idCourse}
              className="border border-border overflow-hidden group hover:shadow-lg transition-shadow duration-300"
              style={{ backgroundColor: "var(--bg)" }}
            >
              {/* Header del curso */}
              <div
                className="p-6 border-b border-border transition-colors duration-300"
                style={{ backgroundColor: "var(--bg)" }}
              >
                <div className="flex justify-between items-start mb-4">
                  <h2
                    className="text-lg font-mono font-bold"
                    style={{ color: "var(--text)" }}
                  >
                    {course.name}
                  </h2>
                  <span
                    className="font-mono text-xs"
                    style={{ color: "var(--primary)" }}
                  >
                    {/* Placeholder for progress since API doesn't provide it yet */}
                    0%
                  </span>
                </div>
                <p
                  className="text-xs mb-6 line-clamp-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  {/* Placeholder for description if not in DTO */}
                  Accede a los contenidos y desafíos de {course.name}.
                </p>

                {/* Barra de progreso */}
                <div className="h-1.5 w-full border border-border overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `0%`,
                      backgroundColor: "var(--primary)",
                    }}
                  />
                </div>
              </div>

              {/* Módulos del curso - Placeholder for now as API is limited */}
              <div
                className="p-6 space-y-4"
                style={{ backgroundColor: "var(--bg)" }}
              >
                <h3
                  className="text-[10px] font-mono font-bold uppercase tracking-widest mb-4"
                  style={{ color: "var(--text-muted)" }}
                >
                  Módulos Disponibles
                </h3>
                <div
                   className="flex items-center justify-between p-3 border border-border/50 transition-all cursor-pointer hover:bg-[var(--surface)]"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: "var(--border)" }}
                    />
                    <div>
                      <p
                        className="text-xs font-semibold"
                        style={{ color: "var(--text)" }}
                      >
                        Contenido General
                      </p>
                      <p
                        className="text-[10px]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Inicia el curso para ver los módulos
                      </p>
                    </div>
                  </div>
                  <span
                    className="material-symbols-outlined text-lg"
                    style={{ color: "var(--text-muted)" }}
                  >
                    chevron_right
                  </span>
                </div>
              </div>

              {/* Botón de acción */}
              <div
                className="p-4 border-t border-border flex justify-end transition-colors duration-300"
                style={{ borderColor: "rgba(var(--border-rgb), 0.4)" }}
              >
                <button
                  className="text-[10px] font-mono font-bold uppercase tracking-widest hover:underline transition-colors duration-300"
                  style={{ color: "var(--primary)" }}
                >
                  Continuar Aprendizaje
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default CursosPage;
