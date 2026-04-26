import React from "react";

const MOCK_GROUPS = [
  { id: "g1", name: "Robótica A", students: 24, requests: 2, avgProgress: 78 },
  {
    id: "g2",
    name: "Mecatrónica B",
    students: 18,
    requests: 0,
    avgProgress: 64,
  },
  { id: "g3", name: "Sistemas I", students: 30, requests: 5, avgProgress: 42 },
];

const MOCK_HELP_REQUESTS = [
  {
    id: "r1",
    student: "Mateo Rivera",
    group: "Sistemas I",
    topic: "Cinemática Inversa",
    date: "Hace 10 min",
  },
  {
    id: "r2",
    student: "Sofía Chen",
    group: "Robótica A",
    topic: "Conexión de Actuadores",
    date: "Hace 1 hora",
  },
];

export const DocenteEstudiantesPage: React.FC = () => {
  return (
    <main
      className="flex-1 p-6 max-w-7xl mx-auto w-full"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <header className="mb-10">
        <h1
          className="text-xl font-mono font-bold tracking-tight mb-2 transition-colors duration-300 hover:text-primary"
          style={{ color: "var(--text)" }}
        >
          Gestión de Estudiantes
        </h1>
        <p
          className="text-sm font-medium transition-colors duration-300"
          style={{ color: "var(--text-muted)" }}
        >
          Control de grupos académicos y atención de solicitudes de ayuda.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Groups Column */}
        <div className="lg:col-span-8 space-y-6">
          <h2
            className="text-[10px] font-mono font-bold uppercase tracking-widest mb-4 transition-colors duration-300"
            style={{ color: "var(--text-muted)" }}
          >
            Grupos Asignados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_GROUPS.map((group) => (
              <div
                key={group.id}
                className="border border-border p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:scale-[1.01] hover:border-primary/50"
                style={{ backgroundColor: "rgba(var(--surface-rgb), 0.4)" }}
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3
                      className="text-sm font-bold transition-colors duration-300"
                      style={{ color: "var(--text)" }}
                    >
                      {group.name}
                    </h3>
                    <p
                      className="text-[10px] font-mono transition-colors duration-300"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {group.students} Estudiantes registrados
                    </p>
                  </div>
                  {group.requests > 0 && (
                    <span className="bg-red-500 text-bg text-[9px] font-mono font-bold px-1.5 py-0.5 animate-pulse rounded">
                      {group.requests} ALERTAS
                    </span>
                  )}
                </div>
                <div>
                  <div
                    className="flex justify-between text-[9px] font-mono uppercase tracking-widest mb-1 transition-colors duration-300"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <span>Progreso Promedio</span>
                    <span>{group.avgProgress}%</span>
                  </div>
                  <div
                    className="h-1 w-full border border-border/50 overflow-hidden transition-all duration-500"
                    style={{ backgroundColor: "var(--bg)" }}
                  >
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${group.avgProgress}%`,
                        backgroundColor: "var(--primary)",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Help Requests Column */}
        <div className="lg:col-span-4 space-y-6">
          <h2
            className="text-[10px] font-mono font-bold uppercase tracking-widest mb-4 transition-colors duration-300"
            style={{ color: "var(--text-muted)" }}
          >
            Solicitudes de Ayuda
          </h2>
          <div className="space-y-3">
            {MOCK_HELP_REQUESTS.map((req) => (
              <div
                key={req.id}
                className="border border-border p-4 relative group transition-all duration-300 hover:shadow-md hover:scale-[1.01] hover:border-primary/50"
                style={{ backgroundColor: "rgba(var(--surface-rgb), 0.6)" }}
              >
                <div className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-primary hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-base">
                      forum
                    </span>
                  </button>
                </div>
                <p
                  className="text-xs font-bold transition-colors duration-300"
                  style={{ color: "var(--text)" }}
                >
                  {req.student}
                </p>
                <p
                  className="text-[10px] font-mono transition-colors duration-300 mb-2"
                  style={{ color: "var(--primary)" }}
                >
                  {req.topic}
                </p>
                <div
                  className="flex justify-between items-center text-[9px] font-mono uppercase tracking-widest transition-colors duration-300"
                  style={{ color: "var(--text-muted)" }}
                >
                  <span>{req.group}</span>
                  <span>{req.date}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full py-3 border border-dashed border-border text-text-muted hover:text-primary hover:border-primary transition-all duration-300 text-[10px] font-mono uppercase tracking-widest hover:scale-[1.01]">
            Historial de Consultas
          </button>
        </div>
      </div>
    </main>
  );
};

export default DocenteEstudiantesPage;
