import { useEffect, useState } from "react";
import { apiService } from "../../infrastructure/api/apiService";
import { getAuthState } from "../../infrastructure/store/authStore";
import type { StudentHistoryDTO } from "../../infrastructure/api/models/apiModels";

interface ResultRow {
  id: string;
  activity: string;
  score: number;
  stars: number;
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

const statusColor = (status: string): string => {
  switch (status) {
    case "Excelente": return "border-primary/50 bg-primary/10 text-primary";
    case "Aprobado": return "border-green-500/50 bg-green-500/10 text-green-400";
    case "En progreso": return "border-yellow-500/50 bg-yellow-500/10 text-yellow-400";
    case "Requiere refuerzo": return "border-red-500/50 bg-red-500/10 text-red-400";
    default: return "border-border text-text-muted";
  }
};

const starsDisplay = (stars: number): string => {
  return "⭐".repeat(stars) + "☆".repeat(3 - stars);
};

export const ResultadosPage: React.FC = () => {
  const [results, setResults] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { user } = getAuthState();
      const userId = user?.id || user?.email || "";

      if (!userId) {
        setError("Inicia sesión para ver tus resultados.");
        setLoading(false);
        return;
      }

      try {
        const history = await apiService.profile.getHistory(userId);

        if (history && history.length > 0) {
          setResults(
            history.map((h: StudentHistoryDTO) => ({
              id: h.idResult || String(Math.random()),
              activity: h.activityName || `Actividad ${h.idActivity}`,
              score: h.score,
              stars: h.stars,
              date: h.dateAttempted || new Date().toISOString().split("T")[0],
              status: deriveStatus(h.score),
              type: "Actividad",
            }))
          );
        } else {
          const stored = getLocalResults();
          if (stored.length > 0) {
            setResults(stored);
          } else {
            setError("No hay resultados disponibles desde el servidor.");
          }
        }
      } catch {
        const stored = getLocalResults();
        if (stored.length > 0) {
          setResults(stored);
        } else {
          setError("No se pudieron cargar los resultados. Verifica tu conexión.");
        }
      }

      setLoading(false);
    };
    load();
  }, []);

  const avgScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
    : 0;
  const totalStars = results.reduce((sum, r) => sum + r.stars, 0);
  const maxScore = results.length > 0
    ? Math.max(...results.map((r) => r.score))
    : 0;

  return (
    <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
      <header className="mb-10">
        <h1 className="text-xl font-mono font-bold tracking-tight mb-2">
          Mis Resultados
        </h1>
        <p className="text-sm font-medium text-muted-foreground">
          Seguimiento de desempeño en actividades y simulaciones robóticas.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
        <div className="border rounded-lg p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl bg-card text-card-foreground">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest mb-2 text-muted-foreground">
            Promedio General
          </span>
          <span className="text-3xl font-mono font-bold text-primary">
            {loading ? "--" : avgScore}
          </span>
          <span className="text-[10px] mt-2 font-mono text-muted-foreground">
            {results.length} actividad(es) registrada(s)
          </span>
        </div>

        <div className="border rounded-lg p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl bg-card text-card-foreground">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest mb-2 text-muted-foreground">
            Estrellas Totales
          </span>
          <span className="text-3xl font-mono font-bold">
            ⭐ {totalStars}
          </span>
          <span className="text-[10px] mt-2 font-mono text-muted-foreground">
            {results.length > 0 ? `Promedio: ${(totalStars / results.length).toFixed(1)} por actividad` : "Sin datos"}
          </span>
        </div>

        <div className="border rounded-lg p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl bg-card text-card-foreground">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest mb-2 text-muted-foreground">
            Actividades Completadas
          </span>
          <span className="text-3xl font-mono font-bold">
            {loading ? "--" : results.length}
          </span>
          <span className="text-[10px] mt-2 font-mono text-muted-foreground">
            {loading ? "" : `Mejor puntaje: ${maxScore}`}
          </span>
        </div>

        <div className="border rounded-lg p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl bg-card text-card-foreground">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest mb-2 text-muted-foreground">
            Mejor Resultado
          </span>
          <span className="text-3xl font-mono font-bold">
            {loading ? "--" : maxScore}
          </span>
          <span className="text-[10px] mt-2 font-mono text-muted-foreground">
            {loading ? "" : deriveStatus(maxScore)}
          </span>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-card">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest">
            Historial de Actividades
          </h2>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center text-sm font-mono text-muted-foreground">
              Cargando resultados...
            </div>
          ) : error ? (
            <div className="p-6 text-center text-sm font-mono text-muted-foreground">
              {error}
            </div>
          ) : results.length === 0 ? (
            <div className="p-6 text-center text-sm font-mono text-muted-foreground">
              No hay resultados disponibles.
            </div>
          ) : (
            <table className="w-full text-left font-mono">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest border-b text-muted-foreground">
                  <th className="px-6 py-4 font-normal">Actividad</th>
                  <th className="px-6 py-4 font-normal">Tipo</th>
                  <th className="px-6 py-4 font-normal">Fecha</th>
                  <th className="px-6 py-4 font-normal">Calificación</th>
                  <th className="px-6 py-4 font-normal">Estrellas</th>
                  <th className="px-6 py-4 font-normal text-right">Estatus</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {results.map((res, index) => (
                  <tr
                    key={res.id}
                    className={`border-b transition-colors duration-200 hover:bg-muted/50 ${index % 2 === 0 ? "bg-card" : "bg-muted/20"}`}
                  >
                    <td className="px-6 py-4 font-semibold">{res.activity}</td>
                    <td className="px-6 py-4 text-muted-foreground">{res.type}</td>
                    <td className="px-6 py-4 text-muted-foreground">{res.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden" style={{ width: "120px" }}>
                          <div
                            className="h-full transition-all duration-500 rounded-full"
                            style={{ width: `${res.score}%`, backgroundColor: "var(--primary)" }}
                          />
                        </div>
                        <span className="font-bold text-primary">{res.score}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {starsDisplay(res.stars)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-2 py-1 text-[9px] border font-mono uppercase tracking-wider rounded-full ${statusColor(res.status)}`}>
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

function getLocalResults(): ResultRow[] {
  try {
    const stored = localStorage.getItem("pipre_results");
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return parsed.map((r: any) => ({
      id: r.challengeId || r.id,
      activity: r.challengeTitle || r.activity || "Actividad",
      score: r.score || 0,
      stars: r.stars || 0,
      date: r.completedAt || new Date().toISOString().split("T")[0],
      status: deriveStatus(r.score || 0),
      type: "Simulación",
    }));
  } catch {
    return [];
  }
}

export default ResultadosPage;
