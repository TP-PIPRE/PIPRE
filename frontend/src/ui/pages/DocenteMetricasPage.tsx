import { useEffect, useState } from "react";
import { ChartNoAxesCombined, RefreshCw } from "lucide-react";
import { loadTeacherMetrics } from "../../application/usecases/loadTeacherMetrics";
import { getApiErrorMessage } from "../../infrastructure/api/errors";

const riskLabels: Record<string, string> = { HIGH: "Alto", MEDIUM: "Medio", LOW: "Bajo", ALTO: "Alto", MEDIO: "Medio", BAJO: "Bajo" };
const dateLabel = (value: string) => new Date(value).toLocaleString("es-CO");
export const DocenteMetricasPage = () => {
  const [data, setData] = useState<Awaited<ReturnType<typeof loadTeacherMetrics>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    loadTeacherMetrics().then(value => { if (active) setData(value); })
      .catch(e => { if (active) setError(getApiErrorMessage(e, "No se pudieron cargar las métricas.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]);
  function refresh() { setLoading(true); setError(""); setRevision(r => r + 1); }
  const partial = data?.students.filter(s => s.errors.length) ?? [];
  return <main className="mx-auto w-full max-w-7xl space-y-6" aria-busy={loading}>
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="page-eyebrow mb-3">Seguimiento académico</p><h1 className="mb-3 font-bold">Métricas y análisis</h1><p className="page-intro">Resultados y progreso registrados de los estudiantes de tus grupos.</p></div>
      <button disabled={loading} onClick={refresh} className="btn-secondary"><RefreshCw size={18} aria-hidden="true" /> Actualizar</button>
    </header>
    {loading ? <p role="status" className="py-12 text-center text-text-muted">Consultando registros académicos…</p> : error ? <div role="alert" className="rounded-lg border border-danger p-5 text-danger"><p>{error}</p><button onClick={refresh} className="btn-secondary mt-3">Reintentar</button></div> : data && <>
      <section aria-label="Resumen de registros" className="grid gap-4 sm:grid-cols-3">
        {[ ["Estudiantes únicos", data.students.length], ["Cursos", data.courseCount], ["Resultados guardados", data.students.reduce((n, s) => n + s.results.length, 0)] ].map(([label, value]) => <div key={label} className="rounded-lg border border-border bg-surface p-5"><p className="text-sm text-text-muted">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>)}
      </section>
      {partial.length > 0 && <p role="alert" className="rounded-lg border border-danger p-4 text-sm text-danger">Datos incompletos de {partial.length} estudiantes: {partial.map(s => `${s.student.studentName} (${s.errors.join(", ")})`).join("; ")}. Puedes reintentar con Actualizar.</p>}
      <section className="rounded-lg border border-border bg-surface p-4 md:p-6">
        <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold"><ChartNoAxesCombined size={20} aria-hidden="true" />Progreso por módulo</h2>
        <p className="mb-4 text-sm text-text-muted">El progreso medio usa el último registro de cada estudiante. La puntuación media incluye todos los resultados guardados de las actividades del módulo.</p>
        {data.modules.length ? <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><caption className="sr-only">Progreso y resultados por módulo</caption><thead><tr className="border-b border-border text-text-muted">{["Módulo", "Progreso medio", "Con registro", "Completaron", "Puntuación media"].map(h => <th key={h} scope="col" className="px-3 py-3 font-semibold">{h}</th>)}</tr></thead><tbody>{data.modules.map(m => <tr key={m.idModule} className="border-b border-border last:border-0"><th scope="row" className="px-3 py-4 font-medium"><span className="block">{m.title}</span><span className="text-xs text-text-muted">{m.courseName}</span></th><td className="px-3 py-4">{m.averageProgress === null ? "Sin registro" : `${m.averageProgress}%`}</td><td className="px-3 py-4">{m.recordedStudents} de {data.students.length}</td><td className="px-3 py-4">{m.completedStudents}</td><td className="px-3 py-4">{m.averageScore === null ? "Sin resultados" : `${m.averageScore} pts · ${m.resultCount} resultados`}</td></tr>)}</tbody></table></div> : <p className="py-6 text-text-muted">Todavía no hay módulos disponibles.</p>}
      </section>
      <section className="rounded-lg border border-border bg-surface p-4 md:p-6">
        <h2 className="mb-2 text-lg font-semibold">Análisis de riesgo registrado</h2><p className="mb-4 text-sm text-text-muted">Se muestra el análisis guardado por el sistema y su fecha. Esta vista no ejecuta modelos de IA.</p>
        {data.students.length ? <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><caption className="sr-only">Último análisis disponible de cada estudiante</caption><thead><tr className="border-b border-border text-text-muted"><th scope="col" className="px-3 py-3">Estudiante</th><th scope="col" className="px-3 py-3">Riesgo registrado</th><th scope="col" className="px-3 py-3">Días sin actividad</th><th scope="col" className="px-3 py-3">Fecha del análisis</th></tr></thead><tbody>{data.students.map(({ student, risk, errors }) => <tr key={student.idStudent} className="border-b border-border last:border-0"><th scope="row" className="px-3 py-4 font-medium">{student.studentName}</th><td className="px-3 py-4">{errors.includes("análisis") ? "No disponible" : risk ? riskLabels[risk.riskLevel.toUpperCase()] ?? risk.riskLevel : "Sin análisis"}</td><td className="px-3 py-4">{risk?.daysInactive ?? "—"}</td><td className="px-3 py-4">{risk ? dateLabel(risk.analysisDate) : "—"}</td></tr>)}</tbody></table></div> : <p className="py-6 text-text-muted">No hay estudiantes asignados a los grupos.</p>}
      </section>
    </>}
  </main>;
};
export default DocenteMetricasPage;
