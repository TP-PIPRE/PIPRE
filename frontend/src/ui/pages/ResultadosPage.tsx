import React from "react";

const MOCK_RESULTS = [
  {
    id: "1",
    activity: "Cinemática de Brazo 3DOF",
    score: 92,
    date: "2026-04-20",
    status: "Excelente",
    type: "Simulación",
  },
  {
    id: "2",
    activity: "Control de Servomotores",
    score: 85,
    date: "2026-04-18",
    status: "Aprobado",
    type: "Teórico",
  },
  {
    id: "3",
    activity: "Sensores Ultrasónicos",
    score: 78,
    date: "2026-04-15",
    status: "Aprobado",
    type: "Simulación",
  },
  {
    id: "4",
    activity: "Lógica Difusa Aplicada",
    score: 98,
    date: "2026-04-10",
    status: "Excelente",
    type: "Proyecto",
  },
];

export const ResultadosPage: React.FC = () => {
  return (
    <main
      className="flex-1 p-6 max-w-7xl mx-auto w-full"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      {/* Header */}
      <header className="mb-10">
        <h1
          className="text-xl font-mono font-bold tracking-tight mb-2"
          style={{ color: "var(--text)" }}
        >
          Mis Resultados
        </h1>
        <p
          className="text-sm font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          Seguimiento de desempeño en actividades y simulaciones robóticas.
        </p>
      </header>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Promedio General */}
        <div
          className="border border-border p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl"
          style={{ backgroundColor: "var(--bg)" }}
        >
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest mb-2">
            Promedio General
          </span>
          <span
            className="text-3xl font-mono font-bold"
            style={{ color: "var(--primary)" }}
          >
            88.2
          </span>
          <span
            className="text-[10px] mt-2 font-mono"
            style={{ color: "rgba(var(--primary-rgb), 0.6)" }}
          >
            ↑ 4.5% vs mes anterior
          </span>
        </div>

        {/* Actividades Completadas */}
        <div
          className="border border-border p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl"
          style={{ backgroundColor: "var(--bg)" }}
        >
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest mb-2">
            Actividades Completadas
          </span>
          <span
            className="text-3xl font-mono font-bold"
            style={{ color: "var(--text)" }}
          >
            14
          </span>
          <span className="text-[10px] mt-2 font-mono">
            De 20 totales este periodo
          </span>
        </div>

        {/* Rango Actual */}
        <div
          className="border border-border p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl"
          style={{ backgroundColor: "var(--bg)" }}
        >
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest mb-2">
            Rango Actual
          </span>
          <span
            className="text-3xl font-mono font-bold"
            style={{ color: "var(--text)" }}
          >
            ORO II
          </span>
          <span className="text-[10px] mt-2 font-mono">
            Próximo nivel en 450 XP
          </span>
        </div>
      </div>

      {/* Tabla de historial */}
      <div
        className="border border-border"
        style={{ backgroundColor: "var(--bg)" }}
      >
        {/* Header de la tabla */}
        <div
          className="p-6 border-b border-border flex justify-between items-center"
          style={{ backgroundColor: "var(--bg)" }}
        >
          <h2
            className="text-xs font-mono font-bold uppercase tracking-widest"
            style={{ color: "var(--text)" }}
          >
            Historial de Actividades
          </h2>
          <button
            className="text-[10px] font-mono uppercase tracking-widest transition-all duration-200 hover:text-primary hover:underline"
            style={{ color: "var(--text-muted)" }}
          >
            Descargar Reporte
          </button>
        </div>

        {/* Contenido de la tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono">
            <thead>
              <tr
                className="text-[10px] uppercase tracking-widest border-b"
                style={{
                  borderColor: "rgba(var(--border-rgb), 0.5)",
                  color: "var(--text-muted)",
                }}
              >
                <th className="px-6 py-4 font-normal">Actividad</th>
                <th className="px-6 py-4 font-normal">Tipo</th>
                <th className="px-6 py-4 font-normal">Fecha</th>
                <th className="px-6 py-4 font-normal">Calificación</th>
                <th className="px-6 py-4 font-normal text-right">Estatus</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {MOCK_RESULTS.map((res) => (
                <tr
                  key={res.id}
                  className="border-b transition-colors duration-200 hover:bg-surface"
                  style={{
                    borderColor: "rgba(var(--border-rgb), 0.3)",
                    backgroundColor: "rgba(var(--bg-rgb), 0.1)",
                  }}
                >
                  <td
                    className="px-6 py-4 font-semibold"
                    style={{ color: "var(--text)" }}
                  >
                    {res.activity}
                  </td>
                  <td
                    className="px-6 py-4"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {res.type}
                  </td>
                  <td
                    className="px-6 py-4"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {res.date}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex-1 h-1 w-12 overflow-hidden"
                        style={{ backgroundColor: "var(--surface)" }}
                      >
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${res.score}%`,
                            backgroundColor: "var(--primary)",
                          }}
                        />
                      </div>
                      <span
                        className="font-bold"
                        style={{ color: "var(--primary)" }}
                      >
                        {res.score}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`px-2 py-1 text-[9px] border font-mono uppercase tracking-wider ${
                        res.status === "Excelente"
                          ? "border-primary/50"
                          : "border-border"
                      }`}
                      style={{
                        backgroundColor:
                          res.status === "Excelente"
                            ? "rgba(var(--primary-rgb), 0.05)"
                            : "transparent",
                        borderColor:
                          res.status === "Excelente"
                            ? "rgba(var(--primary-rgb), 0.5)"
                            : "var(--border)",
                        color:
                          res.status === "Excelente"
                            ? "var(--primary)"
                            : "var(--text-muted)",
                      }}
                    >
                      {res.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default ResultadosPage;
