import React from "react";

const MOCK_COURSES = [
  {
    id: "1",
    title: "Robótica Industrial I",
    desc: "Fundamentos de cinemática y programación de brazos robóticos.",
    progress: 65,
    modules: [
      { id: "m1", name: "Introducción a Actuadores", lessons: 4, completed: 4 },
      { id: "m2", name: "Cinemática Inversa", lessons: 6, completed: 2 },
      { id: "m3", name: "Sistemas de Control", lessons: 5, completed: 0 },
    ],
  },
  {
    id: "2",
    title: "Visión Artificial",
    desc: "Procesamiento de imágenes y detección de objetos en tiempo real.",
    progress: 20,
    modules: [
      { id: "m4", name: "Filtros Espaciales", lessons: 3, completed: 3 },
      { id: "m5", name: "Redes Neuronales", lessons: 8, completed: 0 },
    ],
  },
];

export const CursosPage: React.FC = () => {
  return (
    <main
      className="flex-1 p-6 max-w-7xl mx-auto w-full"
      style={{
        backgroundColor: "var(--theme-bg)",
        color: "var(--theme-text)",
      }}
    >
      <header className="mb-10">
        <h1
          className="text-xl font-mono font-bold tracking-tight mb-2"
          style={{ color: "var(--theme-text)" }}
        >
          Mis Cursos
        </h1>
        <p
          className="text-sm font-medium"
          style={{ color: "var(--theme-text-muted)" }}
        >
          Explora tus módulos, lecciones y actividades de simulación.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {MOCK_COURSES.map((course) => (
          <div
            key={course.id}
            className="border border-border overflow-hidden group"
            style={{
              backgroundColor: "rgba(var(--theme-surface-rgb), 0.4)",
            }}
          >
            {/* Header del curso */}
            <div
              className="p-6 border-b border-border"
              style={{
                backgroundColor: "rgba(var(--theme-surface-rgb), 0.6)",
              }}
            >
              <div className="flex justify-between items-start mb-4">
                <h2
                  className="text-lg font-mono font-bold transition-colors"
                  style={{ color: "var(--theme-text)" }}
                >
                  {course.title}
                </h2>
                <span
                  className="font-mono text-xs"
                  style={{ color: "var(--theme-primary)" }}
                >
                  {course.progress}%
                </span>
              </div>
              <p
                className="text-xs mb-6 line-clamp-2"
                style={{ color: "var(--theme-text-muted)" }}
              >
                {course.desc}
              </p>

              {/* Barra de progreso */}
              <div
                className="h-1.5 w-full border border-border overflow-hidden"
                style={{ backgroundColor: "var(--theme-secondary)" }}
              >
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${course.progress}%`,
                    backgroundColor: "var(--theme-primary)",
                  }}
                />
              </div>
            </div>

            {/* Módulos del curso */}
            <div
              className="p-6 space-y-4"
              style={{ backgroundColor: "rgba(var(--theme-bg-rgb), 0.2)" }}
            >
              <h3
                className="text-[10px] font-mono font-bold uppercase tracking-widest mb-4"
                style={{ color: "var(--theme-text-muted)" }}
              >
                Módulos del Curso
              </h3>
              {course.modules.map((module) => (
                <div
                  key={module.id}
                  className="flex items-center justify-between p-3 border border-border/50 hover:border-primary/30 transition-all cursor-pointer"
                  style={{
                    borderColor: "rgba(var(--theme-border-rgb), 0.5)",
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          module.completed === module.lessons
                            ? "var(--theme-primary)"
                            : "var(--theme-border)",
                      }}
                    />
                    <div>
                      <p
                        className="text-xs font-semibold"
                        style={{ color: "var(--theme-text)" }}
                      >
                        {module.name}
                      </p>
                      <p
                        className="text-[10px]"
                        style={{ color: "var(--theme-text-muted)" }}
                      >
                        {module.completed} de {module.lessons} lecciones
                        completadas
                      </p>
                    </div>
                  </div>
                  <span
                    className="material-symbols-outlined text-lg"
                    style={{ color: "var(--theme-text-muted)" }}
                  >
                    chevron_right
                  </span>
                </div>
              ))}
            </div>

            {/* Botón de acción */}
            <div
              className="p-4 border-t border-border flex justify-end"
              style={{ borderColor: "rgba(var(--theme-border-rgb), 0.4)" }}
            >
              <button
                className="text-[10px] font-mono font-bold uppercase tracking-widest hover:underline transition-colors"
                style={{ color: "var(--theme-primary)" }}
              >
                Continuar Aprendizaje
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};

export default CursosPage;
