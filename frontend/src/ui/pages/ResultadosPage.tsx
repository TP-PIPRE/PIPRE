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
          style={{
            backgroundColor: "var(--surface)",
            borderRadius: "var(--theme-radius)",
          }}
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
          style={{
            backgroundColor: "var(--surface)",
            borderRadius: "var(--theme-radius)",
          }}
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
          style={{
            backgroundColor: "var(--surface)",
            borderRadius: "var(--theme-radius)",
          }}
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
        className="border border-border rounded-lg overflow-hidden"
        style={{ backgroundColor: "var(--surface)" }}
      >
        {/* Header de la tabla */}
        <div className="p-6 border-b border-border flex justify-between items-center bg-surface">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-text">
            Historial de Actividades
          </h2>
          <button className="text-[10px] font-mono uppercase tracking-widest transition-all duration-200 hover:text-primary hover:underline text-text-muted">
            Descargar Reporte
          </button>
        </div>

        {/* Contenido de la tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest border-b border-border">
                <th className="px-6 py-4 font-normal text-text-muted">
                  Actividad
                </th>
                <th className="px-6 py-4 font-normal text-text-muted">Tipo</th>
                <th className="px-6 py-4 font-normal text-text-muted">Fecha</th>
                <th className="px-6 py-4 font-normal text-text-muted">
                  Calificación
                </th>
                <th className="px-6 py-4 font-normal text-right text-text-muted">
                  Estatus
                </th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {MOCK_RESULTS.map((res, index) => (
                <tr
                  key={res.id}
                  className={`border-b border-border transition-colors duration-200 hover:bg-surface-brighter ${index % 2 === 0 ? "bg-surface" : "bg-surface/50"}`}
                >
                  <td className="px-6 py-4 font-semibold text-text">
                    {res.activity}
                  </td>
                  <td className="px-6 py-4 text-text-muted">{res.type}</td>
                  <td className="px-6 py-4 text-text-muted">{res.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex-1 h-1.5 bg-surface-brighter rounded-full overflow-hidden"
                        style={{ width: "120px" }}
                      >
                        <div
                          className="h-full transition-all duration-500 rounded-full"
                          style={{
                            width: `${res.score}%`,
                            backgroundColor: "var(--primary)",
                          }}
                        />
                      </div>
                      <span className="font-bold text-primary">
                        {res.score}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`px-2 py-1 text-[9px] border font-mono uppercase tracking-wider rounded-full ${
                        res.status === "Excelente"
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-border text-text-muted"
                      }`}
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
