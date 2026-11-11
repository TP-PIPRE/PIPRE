import { useState, type FormEvent } from "react";
import { RefreshCw } from "lucide-react";
import { useAsyncResource } from "../../application/hooks/useAsyncResource";
import { apiService } from "../../infrastructure/api/apiService";
import { getApiErrorMessage } from "../../infrastructure/api/errors";
import { getAuthState } from "../../infrastructure/store/authStore";
import { educationalMetricsService } from "../../infrastructure/api/educationalMetricsService";
import type { MetricsFilter, MetricsOptions } from "../../infrastructure/api/models/educationalMetricsModels";
import { MetricsSections, type MetricsSection } from "../components/metrics/MetricsSections";
import { HistoryTable } from "../components/Perfil/HistoryTable";

const input = "mt-1 min-h-11 w-full rounded-lg border border-border bg-bg px-3 text-text";

function defaultFilter(): MetricsFilter {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts();
  const get = (part: string) => day.find(value => value.type === part)?.value;
  const today = `${get("year")}-${get("month")}-${get("day")}`;
  const first = new Date(`${today}T00:00:00Z`);
  first.setUTCDate(first.getUTCDate() - 29);
  return { from: first.toISOString().slice(0, 10), to: today, group: "", grade: "", game: "", student: "" };
}

function MetricsFilters({ options, initial, apply }: { options: MetricsOptions; initial: MetricsFilter; apply: (value: MetricsFilter) => void }) {
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState("");
  const inGroup = options.students.filter(row => !draft.group || row.groups.includes(draft.group));
  const grades = [...new Set(inGroup.map(row => row.grade).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
  const students = inGroup.filter(row => !draft.grade || row.grade === draft.grade);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (draft.from > draft.to) {
      setError("La fecha de inicio debe ser anterior o igual a la fecha final.");
      return;
    }
    setError("");
    apply(draft);
  };
  return <form aria-label="Filtros de métricas" onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-5">
    <div className="grid grid-cols-2 gap-3 text-sm lg:grid-cols-3 2xl:grid-cols-6">
      <label className="min-w-0">Aula<select className={input} value={draft.group} onChange={event => setDraft({ ...draft, group: event.target.value, grade: "", student: "" })}>
        <option value="">{options.institution ? "Todas las aulas" : "Mis aulas"}</option>
        {options.groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
      </select></label>
      <label className="min-w-0">Grado<select className={input} value={draft.grade} onChange={event => setDraft({ ...draft, grade: event.target.value, student: "" })}>
        <option value="">Todos los grados</option>{grades.map(grade => <option key={grade}>{grade}</option>)}
      </select></label>
      <label className="min-w-0">Curso<select className={input} value={draft.game} onChange={event => setDraft({ ...draft, game: event.target.value as MetricsFilter["game"] })}>
        <option value="">Ambos cursos</option><option value="neonflow">Neon Flow</option><option value="tetrilogic">TetriLogic</option>
      </select></label>
      <label className="min-w-0">Estudiante<select className={input} value={draft.student} onChange={event => setDraft({ ...draft, student: event.target.value })}>
        <option value="">Todos los estudiantes</option>{students.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}
      </select></label>
      <label className="min-w-0">Desde<input type="date" required className={input} value={draft.from} onChange={event => setDraft({ ...draft, from: event.target.value })} /></label>
      <label className="min-w-0">Hasta<input type="date" required className={input} value={draft.to} onChange={event => setDraft({ ...draft, to: event.target.value })} /></label>
    </div>
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-sm text-text-muted">Fechas de Lima</span><button className="btn-premium" type="submit">Aplicar filtros</button>
    </div>
  </form>;
}

function SelectedStudentHistory({ student }: { student: { id: string; name: string } }) {
  const resource = useAsyncResource(student.id, () => apiService.profile.getHistory(student.id));
  const verified = resource.data?.filter(entry => entry.source === "SERVER_VERIFIED");
  return <section className="space-y-3 rounded-xl border border-border bg-surface p-4 sm:p-5">
    <h2 className="text-lg font-semibold">Historial de {student.name}</h2>
    <p className="text-sm text-text-muted">Victorias registradas de ambos cursos en el historial completo.</p>
    {resource.loading && <p role="status" className="text-sm text-text-muted">Consultando historial…</p>}
    {Boolean(resource.error) && <div role="alert" className="space-y-2">
      <p>{getApiErrorMessage(resource.error, "No se pudo cargar el historial del estudiante.")}</p>
      <button className="btn-secondary" onClick={resource.retry}>Reintentar historial</button>
    </div>}
    {verified && (verified.length ? <HistoryTable history={verified} /> : <p className="text-sm text-text-muted">Sin victorias verificadas.</p>)}
  </section>;
}

export function DocenteMetricasPage() {
  const user = getAuthState().user;
  const [filter, setFilter] = useState(defaultFilter);
  const [section, setSection] = useState<MetricsSection>("Resumen");
  const options = useAsyncResource(user?.id ?? "metrics-options", educationalMetricsService.options);
  const reportKey = JSON.stringify([user?.id, filter]);
  const report = useAsyncResource(options.data ? reportKey : undefined, () => educationalMetricsService.report(filter));
  const loading = options.loading || report.loading;
  const error = options.error ?? report.error;
  const selected = filter.student && section === "Resumen" ? report.data?.students.find(student => student.id === filter.student) : undefined;
  const refresh = () => { if (options.error) options.retry(); else report.retry(); };
  return <main className="mx-auto w-full max-w-7xl space-y-6" aria-busy={loading}>
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
      <div><h1 className="font-bold">Métricas educativas</h1>
        <p className="mt-2 text-text-muted">{user?.role === "admin" ? "Vista institucional de aulas, grados y estudiantes." : "Seguimiento de las aulas y estudiantes asignados."}</p>
      </div>
      <button className="btn-secondary" onClick={refresh} disabled={loading}><RefreshCw size={18} aria-hidden="true" />Actualizar</button>
    </header>
    {options.data && <MetricsFilters options={options.data} initial={filter} apply={setFilter} />}
    {loading && <p role="status" className="py-12 text-center text-text-muted">Consultando partidas y resultados verificados…</p>}
    {Boolean(error) && <div role="alert" className="rounded-lg border border-danger p-5">
      <p>{getApiErrorMessage(error, "No se pudieron cargar las métricas.")}</p>
      <button className="btn-secondary mt-3" onClick={refresh}>Reintentar</button>
    </div>}
    {report.data && <MetricsSections report={report.data} institution={options.data?.institution === true} section={section} select={setSection} />}
    {selected && <SelectedStudentHistory student={selected} />}
  </main>;
}

export default DocenteMetricasPage;
