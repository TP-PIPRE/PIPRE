import React from "react";

const MOCK_COURSES = [
  {
    id: "1",
    title: "Robótica Industrial I",
    modules: 12,
    activities: 24,
    status: "Activo",
  },
  {
    id: "2",
    title: "Visión Artificial Avanzada",
    modules: 8,
    activities: 15,
    status: "Borrador",
  },
  {
    id: "3",
    title: "Sistemas Embebidos",
    modules: 10,
    activities: 20,
    status: "Activo",
  },
];

export const DocenteRetosPage: React.FC = () => {
  return (
    <main
      className="flex-1 p-6 max-w-7xl mx-auto w-full"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1
            className="text-xl font-mono font-bold tracking-tight mb-2 transition-colors duration-300 hover:text-primary"
            style={{ color: "var(--text)" }}
          >
            Gestión de Retos y Cursos
          </h1>
          <p
            className="text-sm font-medium transition-colors duration-300"
            style={{ color: "var(--text-muted)" }}
          >
            Administra la estructura curricular: Cursos, Módulos y Actividades
            de Simulación.
          </p>
        </div>
        <button className="bg-primary text-bg px-5 py-2.5 font-mono font-bold uppercase text-[10px] tracking-widest hover:opacity-90 transition-all duration-300 hover:scale-105">
          Crear Nuevo Curso
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {MOCK_COURSES.map((course) => (
          <div
            key={course.id}
            className="border border-border p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300 hover:scale-[1.01] hover:shadow-md"
            style={{ backgroundColor: "rgba(var(--surface-rgb), 0.4)" }}
          >
            <div className="flex items-center gap-6">
              <div
                className="w-12 h-12 flex items-center justify-center border border-border transition-all duration-300"
                style={{ backgroundColor: "var(--surface)" }}
              >
                <span
                  className="material-symbols-outlined transition-colors duration-300"
                  style={{ color: "var(--primary)" }}
                >
                  account_tree
                </span>
              </div>
              <div>
                <h2
                  className="text-sm font-bold transition-colors duration-300"
                  style={{ color: "var(--text)" }}
                >
                  {course.title}
                </h2>
                <div
                  className="flex gap-4 text-[10px] font-mono uppercase tracking-widest transition-colors duration-300"
                  style={{ color: "var(--text-muted)" }}
                >
                  <span>{course.modules} Módulos</span>
                  <span>{course.activities} Actividades</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex flex-col items-end">
                <span
                  className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 border transition-all duration-300 ${
                    course.status === "Activo"
                      ? "border-green-500/30 text-green-500 bg-green-500/10"
                      : course.status === "Borrador"
                        ? "border-yellow-500/30 text-yellow-500 bg-yellow-500/10"
                        : "border-border text-text-muted"
                  }`}
                >
                  {course.status}
                </span>
              </div>
              <div className="flex gap-2">
                <button className="p-2 border border-border hover:border-blue-500 hover:text-blue-500 transition-all duration-300 hover:scale-110">
                  <span className="material-symbols-outlined text-lg">
                    edit
                  </span>
                </button>
                <button className="p-2 border border-border hover:border-red-500 hover:text-red-500 transition-all duration-300 hover:scale-110">
                  <span className="material-symbols-outlined text-lg">
                    delete
                  </span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className="mt-12 p-10 border border-dashed border-border flex flex-col items-center justify-center text-center transition-all duration-300 hover:border-primary/50 hover:bg-primary/10"
        style={{ backgroundColor: "rgba(var(--bg-rgb), 0.2)" }}
      >
        <span
          className="material-symbols-outlined text-4xl transition-all duration-300 hover:text-primary/70"
          style={{ color: "rgba(var(--text-muted-rgb), 0.2)" }}
        >
          add_circle
        </span>
        <h3
          className="text-xs font-mono font-bold uppercase tracking-widest mb-2 transition-colors duration-300"
          style={{ color: "var(--text-muted)" }}
        >
          Editor de Actividades
        </h3>
        <p
          className="text-[11px] transition-colors duration-300"
          style={{ color: "rgba(var(--text-muted-rgb), 0.6)" }}
        >
          Crea simulaciones personalizadas vinculando bloques de código a
          comportamientos robóticos.
        </p>
      </div>
    </main>
  );
};

export default DocenteRetosPage;
