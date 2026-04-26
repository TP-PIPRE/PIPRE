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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {MOCK_COURSES.map((course) => (
          <div
            key={course.id}
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
                  {course.title}
                </h2>
                <span
                  className="font-mono text-xs"
                  style={{ color: "var(--primary)" }}
                >
                  {course.progress}%
                </span>
              </div>
              <p
                className="text-xs mb-6 line-clamp-2"
                style={{ color: "var(--text-muted)" }}
              >
                {course.desc}
              </p>

              {/* Barra de progreso */}
              <div className="h-1.5 w-full border border-border overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${course.progress}%`,
                    backgroundColor: "var(--primary)",
                  }}
                />
              </div>
            </div>

            {/* Módulos del curso */}
            <div
              className="p-6 space-y-4"
              style={{ backgroundColor: "var(--bg)" }}
            >
              <h3
                className="text-[10px] font-mono font-bold uppercase tracking-widest mb-4"
                style={{ color: "var(--text-muted)" }}
              >
                Módulos del Curso
              </h3>
              {course.modules.map((module) => (
                <div
                  key={module.id}
                  className="flex items-center justify-between p-3 border border-border/50 transition-all cursor-pointer"
                  style={{ borderColor: "rgba(var(--border-rgb), 0.5)" }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--surface)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-2 h-2 rounded-full transition-colors duration-300"
                      style={{
                        backgroundColor:
                          module.completed === module.lessons
                            ? "var(--primary)"
                            : "var(--border)",
                      }}
                    />
                    <div>
                      <p
                        className="text-xs font-semibold"
                        style={{ color: "var(--text)" }}
                      >
                        {module.name}
                      </p>
                      <p
                        className="text-[10px]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {module.completed} de {module.lessons} lecciones
                        completadas
                      </p>
                    </div>
                  </div>
                  <span
                    className="material-symbols-outlined text-lg transition-colors duration-300"
                    style={{
                      color: "var(--text-muted)",
                      transition: "color 0.3s ease, transform 0.3s ease",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.color = "var(--primary)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.color = "var(--text-muted)";
                    }}
                  >
                    chevron_right
                  </span>
                </div>
              ))}
            </div>

            {/* Botón de acción */}
            <div
              className="p-4 border-t border-border flex justify-end transition-colors duration-300"
              style={{ borderColor: "rgba(var(--border-rgb), 0.4)" }}
            >
              <button
                className="text-[10px] font-mono font-bold uppercase tracking-widest hover:underline transition-colors duration-300"
                style={{ color: "var(--primary)" }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = "var(--primary-glow)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = "var(--primary)";
                }}
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
