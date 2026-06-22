import React, { useEffect, useState } from "react";
import { apiService } from "../../infrastructure/api/apiService";
import type { StudentResult } from "../../shared/types/Simulador";

const MOCK_RESULTS: ResultRow[] = [
  { id: "1", activity: "Cinemática de Brazo 3DOF", score: 92, date: "2026-04-20", status: "Excelente", type: "Simulación" },
  { id: "2", activity: "Control de Servomotores", score: 85, date: "2026-04-18", status: "Aprobado", type: "Teórico" },
  { id: "3", activity: "Sensores Ultrasónicos", score: 78, date: "2026-04-15", status: "Aprobado", type: "Simulación" },
  { id: "4", activity: "Lógica Difusa Aplicada", score: 98, date: "2026-04-10", status: "Excelente", type: "Proyecto" },
];

interface ResultRow {
  id: string;
  activity: string;
  score: number;
  date: string;
  status: string;
  type: string;
}

const deriveStatus = (score: number): string => {
  if (score >= 90) return "Excelente";
  if (score >= 70) return "Aprobado";
  if (score >= 50) return "En progreso";
  return "Requiere refuerzo";
};

const statusOptions = ["Excelente", "Aprobado", "En progreso", "Requiere refuerzo"] as const;
type Status = (typeof statusOptions)[number];

const statusColor = (status: Status): string => {
  switch (status) {
    case "Excelente": return "border-primary/50 bg-primary/10 text-primary";
    case "Aprobado": return "border-green-500/50 bg-green-500/10 text-green-400";
    case "En progreso": return "border-yellow-500/50 bg-yellow-500/10 text-yellow-400";
    case "Requiere refuerzo": return "border-red-500/50 bg-red-500/10 text-red-400";
    default: return "border-border text-text-muted";
  }
};

const getLocalResults = (): ResultRow[] => {
  try {
    const stored = localStorage.getItem("pipre_results");
    if (!stored) return [];
    const results: StudentResult[] = JSON.parse(stored);
    if (results.length === 0) return [];
    return results.map((r) => ({
      id: r.challengeId,
      activity: r.challengeTitle,
      score: r.score,
      date: r.completedAt,
      status: deriveStatus(r.score),
      type: r.environment === "robotics" ? "Simulación" : "Actividad",
    }));
  } catch {
    return [];
  }
};

const fetchApiResults = async (): Promise<ResultRow[]> => {
  const userId = "current-user";
  try {
    const [apiResults, sims] = await Promise.all([
      apiService.results.getByUser(userId).catch(() => []),
      apiService.simulations.getByUser(userId).catch(() => []),
    ]);
    const rows: ResultRow[] = [];
    if (apiResults.length > 0) {
      rows.push(
        ...apiResults.map((r) => ({
          id: r.idActivity,
          activity: `Actividad ${r.idActivity}`,
          score: r.score,
          date: new Date().toISOString().split("T")[0],
          status: deriveStatus(r.score),
          type: "Actividad",
        })),
      );
    }
    if (sims.length > 0) {
      rows.push(
        ...sims.map((s) => ({
          id: s.id_simulation,
          activity: `Simulación ${s.id_simulation}`,
          score: s.result,
          date: new Date().toISOString().split("T")[0],
          status: deriveStatus(s.result),
          type: "Simulación",
        })),
      );
    }
    return rows;
  } catch {
    return [];
  }
};

export const ResultadosPage: React.FC = () => {
  const [results, setResults] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      let data = getLocalResults();
      if (data.length > 0) {
        setResults(data);
        setLoading(false);
        return;
      }
      data = await fetchApiResults();
      if (data.length > 0) {
        setResults(data);
      } else {
        setResults(MOCK_RESULTS);
      }
      setLoading(false);
    };
    load();
  }, []);

  const avgScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
    : 0;
  const maxScore = results.length > 0
    ? Math.max(...results.map((r) => r.score))
    : 0;

  return (
    <main
      className="flex-1 p-6 max-w-7xl mx-auto w-full"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <header className="mb-10">
        <h1 className="text-xl font-mono font-bold tracking-tight mb-2" style={{ color: "var(--text)" }}>
          Mis Resultados
        </h1>
        <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
          Seguimiento de desempeño en actividades y simulaciones robóticas.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div
          className="border border-border p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl"
          style={{ backgroundColor: "var(--surface)", borderRadius: "var(--theme-radius)" }}
        >
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest mb-2">
            Promedio General
          </span>
          <span className="text-3xl font-mono font-bold" style={{ color: "var(--primary)" }}>
            {loading ? "--" : avgScore}
          </span>
          <span className="text-[10px] mt-2 font-mono" style={{ color: "rgba(var(--primary-rgb), 0.6)" }}>
            {results.length} actividad(es) registrada(s)
          </span>
        </div>

        <div
          className="border border-border p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl"
          style={{ backgroundColor: "var(--surface)", borderRadius: "var(--theme-radius)" }}
        >
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest mb-2">
            Actividades Completadas
          </span>
          <span className="text-3xl font-mono font-bold" style={{ color: "var(--text)" }}>
            {loading ? "--" : results.length}
          </span>
          <span className="text-[10px] mt-2 font-mono">
            {loading ? "" : `Mejor puntaje: ${maxScore}`}
          </span>
        </div>

        <div
          className="border border-border p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl"
          style={{ backgroundColor: "var(--surface)", borderRadius: "var(--theme-radius)" }}
        >
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest mb-2">
            Mejor Resultado
          </span>
          <span className="text-3xl font-mono font-bold" style={{ color: "var(--text)" }}>
            {loading ? "--" : maxScore}
          </span>
          <span className="text-[10px] mt-2 font-mono">
            {loading ? "" : deriveStatus(maxScore)}
          </span>
        </div>
      </div>

      <div
        className="border border-border rounded-lg overflow-hidden"
        style={{ backgroundColor: "var(--surface)" }}
      >
        <div className="p-6 border-b border-border flex justify-between items-center bg-surface">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-text">
            Historial de Actividades
          </h2>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center text-sm font-mono" style={{ color: "var(--text-muted)" }}>
              Cargando resultados...
            </div>
          ) : results.length === 0 ? (
            <div className="p-6 text-center text-sm font-mono" style={{ color: "var(--text-muted)" }}>
              No hay resultados disponibles.
            </div>
          ) : (
            <table className="w-full text-left font-mono">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest border-b border-border">
                  <th className="px-6 py-4 font-normal text-text-muted">Actividad</th>
                  <th className="px-6 py-4 font-normal text-text-muted">Tipo</th>
                  <th className="px-6 py-4 font-normal text-text-muted">Fecha</th>
                  <th className="px-6 py-4 font-normal text-text-muted">Calificación</th>
                  <th className="px-6 py-4 font-normal text-right text-text-muted">Estatus</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {results.map((res, index) => (
                  <tr
                    key={res.id}
                    className={`border-b border-border transition-colors duration-200 hover:bg-surface-brighter ${index % 2 === 0 ? "bg-surface" : "bg-surface/50"}`}
                  >
                    <td className="px-6 py-4 font-semibold text-text">{res.activity}</td>
                    <td className="px-6 py-4 text-text-muted">{res.type}</td>
                    <td className="px-6 py-4 text-text-muted">{res.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-surface-brighter rounded-full overflow-hidden" style={{ width: "120px" }}>
                          <div
                            className="h-full transition-all duration-500 rounded-full"
                            style={{ width: `${res.score}%`, backgroundColor: "var(--primary)" }}
                          />
                        </div>
                        <span className="font-bold text-primary">{res.score}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`px-2 py-1 text-[9px] border font-mono uppercase tracking-wider rounded-full ${statusColor(res.status as Status)}`}
                      >
                        {res.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
};

export default ResultadosPage;
