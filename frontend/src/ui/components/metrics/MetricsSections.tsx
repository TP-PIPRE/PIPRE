import { useState, type ReactNode } from "react";
import type { MetricsDimension, MetricsReport, MetricsStudent } from "../../../infrastructure/api/models/educationalMetricsModels";

const numbers = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 });
const number = (value: number | null) => value === null ? "—" : numbers.format(value);
const percent = (value: number | null) => value === null ? "—" : `${number(value)} %`;
const minutes = (value: number | null) => value === null ? "—" : `${number(value / 60)} min`;
const dateLabel = (value: string) => `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}`;
const gameNames = { neonflow: "Neon Flow", tetrilogic: "TetriLogic" };
const cell = "px-3 py-3";

function Panel({ title, detail, children }: { title: string; detail?: string; children: ReactNode }) {
  return <section className="min-w-0 space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-5">
    <header><h2 className="text-lg font-semibold">{title}</h2>{detail && <p className="mt-1 text-sm text-text-muted">{detail}</p>}</header>
    {children}
  </section>;
}

function Stats({ values }: { values: [string, ReactNode][] }) {
  return <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
    {values.map(([label, value]) => <div key={label} className="border-l-2 border-border pl-3">
      <dt className="text-sm text-text-muted">{label}</dt><dd className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">{value}</dd>
    </div>)}
  </dl>;
}

function Table({ caption, headers, rows }: { caption: string; headers: string[]; rows: ReactNode[][] }) {
  if (!rows.length) return <p className="text-sm text-text-muted">Sin registros para estos filtros.</p>;
  return <div className="overflow-x-auto rounded-lg border border-border" tabIndex={0} role="region" aria-label={caption}>
    <table className="w-full min-w-max text-left text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead className="bg-surface-brighter text-text-muted"><tr>{headers.map(label => <th className={cell} key={label} scope="col">{label}</th>)}</tr></thead>
      <tbody>{rows.map((row, index) => <tr key={index} className="border-t border-border">
        <th className={`${cell} whitespace-nowrap font-medium`} scope="row">{row[0]}</th>
        {row.slice(1).map((value, column) => <td className={`${cell} whitespace-nowrap tabular-nums`} key={column}>{value}</td>)}
      </tr>)}</tbody>
    </table>
  </div>;
}

function Bars({ rows, format = number, maximum }: { rows: { label: string; value: number | null }[]; format?: (value: number | null) => string; maximum?: number }) {
  if (!rows.length) return <p className="text-sm text-text-muted">Sin registros para estos filtros.</p>;
  const scale = maximum ?? Math.max(1, ...rows.map(row => row.value ?? 0));
  return <ul className="space-y-3">{rows.map((row, index) => <li key={`${row.label}:${index}`} className="space-y-1">
    <div className="flex justify-between gap-3 text-sm"><span>{row.label}</span><strong className="shrink-0 tabular-nums">{format(row.value)}</strong></div>
    <div aria-hidden="true" className="h-2 overflow-hidden rounded bg-surface-brighter"><div className="h-full rounded bg-primary" style={{ width: `${100 * (row.value ?? 0) / scale}%` }} /></div>
  </li>)}</ul>;
}

type TrendPoint = { day: string; value: number; secondary: string };
function Trend({ title, points, valueLabel, detailLabel, asPercent = false }: {
  title: string; points: TrendPoint[]; valueLabel: string; detailLabel: string; asPercent?: boolean;
}) {
  if (!points.length) return <p className="text-sm text-text-muted">Sin actividad en el periodo seleccionado.</p>;
  const max = asPercent ? 100 : Math.max(1, ...points.map(point => point.value));
  const ms = (day: string) => Date.parse(`${day}T00:00:00Z`);
  const first = ms(points[0].day);
  const last = points[points.length - 1];
  const span = ms(last.day) - first;
  const xy = (point: TrendPoint) => [span ? 12 + 616 * (ms(point.day) - first) / span : 320, 142 - 130 * point.value / max];
  const position = points.map(point => xy(point).join(",")).join(" ");
  const format = asPercent ? percent : number;
  return <figure className="space-y-3">
    <svg viewBox="0 0 640 154" className="w-full overflow-visible rounded-lg bg-surface-brighter text-primary" aria-hidden="true">
      {[12, 77, 142].map(y => <line key={y} x1="12" x2="628" y1={y} y2={y} className="stroke-border" />)}
      <polyline points={position} fill="none" stroke="currentColor" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      {points.length <= 45 && points.map(point => { const [cx, cy] = xy(point); return <circle key={point.day} cx={cx} cy={cy} r="3.5" fill="currentColor" />; })}
    </svg>
    <figcaption className="flex flex-wrap justify-between gap-2 text-sm text-text-muted"><span>{dateLabel(points[0].day)}{span > 0 && ` – ${dateLabel(last.day)}`}</span><span>Último registro · {format(last.value)}</span></figcaption>
    <details><summary className="cursor-pointer text-sm font-medium text-primary">Ver valores de la serie</summary>
      <div className="mt-3"><Table caption={title} headers={["Fecha", valueLabel, detailLabel]} rows={points.map(point => [dateLabel(point.day), format(point.value), point.secondary])} /></div>
    </details>
  </figure>;
}

function StudentTable({ students, courses }: { students: MetricsStudent[]; courses: MetricsReport["courses"] }) {
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(0);
  const ordered = [...students].sort((a, b) => {
    if (sort === "progress") return a.neonflowLevels + a.tetrilogicLevels - b.neonflowLevels - b.tetrilogicLevels || a.name.localeCompare(b.name);
    if (sort === "attempts") return (b.averageAttempts ?? -1) - (a.averageAttempts ?? -1) || a.name.localeCompare(b.name);
    return a.name.localeCompare(b.name, "es");
  });
  const size = 12;
  return <Panel title="Desempeño individual" detail="Ordena por menor avance o por más intentos hasta resolver para revisar dificultades recurrentes.">
    <label className="flex flex-wrap items-center gap-2 text-sm">Ordenar por
      <select className="min-h-11 rounded-lg border border-border bg-bg px-3" value={sort} onChange={event => { setSort(event.target.value); setPage(0); }}>
        <option value="name">Nombre</option><option value="progress">Menor avance acumulado</option><option value="attempts">Más intentos hasta resolver</option>
      </select>
    </label>
    <Table caption="Indicadores por estudiante" headers={["Estudiante", "Grado", "Estrellas", "Logros", "Retos resueltos", "Intentos hasta resolver", "Días activos", "Sesiones", "Duración media", ...courses.map(course => course.name)]}
      rows={ordered.slice(page * size, (page + 1) * size).map(row => [row.name, row.grade || "—", number(row.stars), number(row.achievements),
        `${row.completed}/${row.initiated}`, number(row.averageAttempts), number(row.days), number(row.sessions), minutes(row.averageSessionSeconds),
        ...courses.map(course => `${course.game === "neonflow" ? row.neonflowLevels : row.tetrilogicLevels}/30`)])} />
    {ordered.length > size && <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
      <span>{page * size + 1}–{Math.min((page + 1) * size, ordered.length)} de {ordered.length}</span>
      <button type="button" className="btn-secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</button>
      <button type="button" className="btn-secondary" disabled={(page + 1) * size >= ordered.length} onClick={() => setPage(page + 1)}>Siguiente</button>
    </div>}
  </Panel>;
}

function Summary({ report, institution }: { report: MetricsReport; institution: boolean }) {
  const [compare, setCompare] = useState<"classroom" | "grade">("classroom");
  const { summary, courses, comparisons } = report;
  const groups = comparisons.filter(row => row.kind === compare);
  return <>
    <Panel title="Rendimiento y gamificación" detail="Los promedios por estudiante incluyen a toda la población filtrada. Los logros abarcan ambos cursos.">
      <Stats values={[["Estudiantes activos", `${number(summary.active)} / ${number(summary.students)}`], ["Estrellas del periodo", number(summary.stars)],
        ["Estrellas por estudiante", number(summary.averageStars)], ["Logros por estudiante", number(summary.averageAchievements)],
        ["Retos completados", `${number(summary.completed)} / ${number(summary.initiated)}`], ["Tasa de finalización", percent(summary.completionRate)],
        ["Intentos hasta resolver", number(summary.averageAttempts)], ["Logros desbloqueados", number(summary.achievements)]]} />
    </Panel>
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Avance por curso" detail="Niveles distintos verificados hasta el cierre sobre 30 por estudiante.">
        <Bars rows={courses.map(course => ({ label: course.name, value: course.progress }))} maximum={100} format={percent} />
      </Panel>
      <Panel title="Comparación de cohortes" detail="El gráfico usa el promedio de estrellas por estudiante. La tabla incluye los totales.">
        <label className="flex items-center gap-2 text-sm">Comparar por <select className="min-h-11 rounded-lg border border-border bg-bg px-3" value={compare} onChange={event => setCompare(event.target.value as typeof compare)}>
          <option value="classroom">Aula</option><option value="grade">Grado</option>
        </select></label>
        <Bars rows={groups.slice(0, 8).map(row => ({ label: row.name, value: row.average_stars }))} />
      </Panel>
    </div>
    <Table caption={compare === "classroom" ? "Comparación por aula" : "Comparación por grado"} headers={[compare === "classroom" ? "Aula" : "Grado", "Estudiantes", "Activos", "Estrellas totales", "Estrellas por estudiante", "Logros totales", "Logros por estudiante", "Retos resueltos", "Finalización"]}
      rows={groups.map(row => [row.name, number(row.students), number(row.active), number(row.stars), number(row.average_stars), number(row.achievements), number(row.average_achievements), number(row.completed), percent(row.completion_rate)])} />
    {institution && <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Distribución de estrellas" detail="Cantidad de niveles por mejor calificación del periodo."><Bars rows={report.starDistribution.map(row => ({ label: `${row.stars} de 3 estrellas`, value: row.count }))} /></Panel>
      <Panel title="Distribución de logros" detail="Cantidad de estudiantes por número de logros nuevos."><Bars rows={report.achievementDistribution.map(row => ({ label: `${row.achievements} logros`, value: row.count }))} /></Panel>
    </div>}
    <StudentTable students={report.students} courses={courses} />
  </>;
}

function Dimensions({ report }: { report: MetricsReport }) {
  const [chosen, setChosen] = useState("");
  const [compare, setCompare] = useState<"classroom" | "grade">("classroom");
  const selected = report.dimensions.find(row => row.dimension === chosen) ?? report.dimensions[0];
  const values = (row: MetricsDimension): [string, ReactNode][] => [
    ["Retos resueltos", `${row.solved}/${row.initiated}`], ["Resolución verificada", percent(row.completion_rate)],
    ["Intentos hasta resolver", number(row.average_attempts)], ["Duración al resolver", minutes(row.average_seconds)],
    ["Estrellas por reto resuelto", number(row.average_stars)], ["Retos resueltos por participante", number(row.solved_per_student)],
  ];
  return <>
    <p className="rounded-lg border border-border bg-surface p-4 text-sm text-text-muted">Desempeño en los retos del simulador con una dimensión registrada. {report.unclassifiedAttempts > 0 && <strong className="text-text">{number(report.unclassifiedAttempts)} sesiones de niveles base sin dimensión registrada.</strong>}</p>
    {report.dimensions.map(row => <Panel key={row.dimension} title={row.dimension}>
      {row.initiated ? <Stats values={values(row)} /> : <p className="text-sm text-text-muted">Sin intentos de retos clasificados para estos filtros.</p>}
    </Panel>)}
    {selected && <Panel title="Evolución y comparación por dimensión" detail="La serie muestra el porcentaje de sesiones iniciadas en cada fecha que se resolvieron antes del cierre del periodo.">
      <label className="flex flex-wrap items-center gap-2 text-sm">Dimensión<select className="min-h-11 rounded-lg border border-border bg-bg px-3" value={selected.dimension} onChange={event => setChosen(event.target.value)}>
        {report.dimensions.map(row => <option key={row.dimension}>{row.dimension}</option>)}
      </select></label>
      <Trend title="Evolución de resolución" valueLabel="Resolución" detailLabel="Sesiones resueltas / iniciadas" asPercent points={selected.timeline.map(row => ({ day: row.day, value: row.completion_rate, secondary: `${row.solved}/${row.sessions}` }))} />
      <label className="flex flex-wrap items-center gap-2 text-sm">Comparar por <select className="min-h-11 rounded-lg border border-border bg-bg px-3" value={compare} onChange={event => setCompare(event.target.value as typeof compare)}>
        <option value="classroom">Aula</option><option value="grade">Grado</option>
      </select></label>
      <Table caption={`Comparación de ${selected.dimension.toLowerCase()}`} headers={[compare === "classroom" ? "Aula" : "Grado", "Retos resueltos", "Resolución verificada", "Intentos hasta resolver", "Estrellas medias"]}
        rows={selected.comparisons.filter(row => row.kind === compare).map(row => [row.name, `${row.solved}/${row.initiated}`, percent(row.completion_rate), number(row.average_attempts), number(row.average_stars)])} />
    </Panel>}
  </>;
}

function Participation({ report }: { report: MetricsReport }) {
  const [game, setGame] = useState("");
  const selected = report.courses.find(course => course.game === game) ?? report.courses[0];
  const { summary } = report;
  return <>
    <Panel title="Interacción y participación" detail="La duración se calcula entre el inicio y el cierre de sesiones registradas. Incluye pausas.">
      <Stats values={[["Sesiones iniciadas", number(summary.sessions)], ["Sesiones resueltas", number(summary.successfulSessions)],
        ["Duración media por sesión", minutes(summary.averageSessionSeconds)], ["Días activos por estudiante", number(summary.averageActiveDays)],
        ["Retos iniciados", number(summary.initiated)], ["Retos completados", number(summary.completed)],
        ["Estudiantes que resolvieron niveles base", percent(summary.completedStudentRate)], ["Estudiantes con avance acumulado", number(summary.studentsWithProgress)]]} />
    </Panel>
    <Panel title="Participación por curso"><Bars rows={report.courses.map(course => ({ label: course.name, value: course.sessions }))} />
      <Table caption="Participación comparada" headers={["Curso", "Estudiantes activos", "Sesiones", "Retos iniciados", "Retos completados"]}
        rows={report.courses.map(course => [course.name, number(course.active), number(course.sessions), number(course.initiated), number(course.completed)])} />
    </Panel>
    {selected && <Panel title="Evolución de la participación" detail={report.bucket === "day" ? "Sesiones por día con registros." : "Sesiones por semana con registros."}>
      <label className="flex flex-wrap items-center gap-2 text-sm">Curso<select className="min-h-11 rounded-lg border border-border bg-bg px-3" value={selected.game} onChange={event => setGame(event.target.value)}>
        {report.courses.map(course => <option key={course.game} value={course.game}>{course.name}</option>)}
      </select></label>
      <Trend title={`Participación en ${gameNames[selected.game]}`} valueLabel="Sesiones iniciadas" detailLabel="Estudiantes activos" points={report.timeline.filter(row => row.game === selected.game).map(row => ({ day: row.day, value: row.sessions, secondary: number(row.active) }))} />
    </Panel>}
  </>;
}

function Tutor({ tutor }: { tutor: MetricsReport["tutor"] }) {
  return <>
    <Panel title="Uso del tutor inteligente" detail="Se cuentan las entregas confirmadas y las pistas contextuales consumidas. El porcentaje de uso de IA se calcula sobre todos los estudiantes del filtro.">
      <Stats values={[["Consejos registrados", number(tutor.total)], ["Consejos por estudiante", number(tutor.average)],
        ["Consejos predeterminados", number(tutor.fixed)], ["Consejos generados por IA", number(tutor.generated)],
        ["Estudiantes que usaron IA", `${number(tutor.studentsUsingAi)} · ${percent(tutor.aiStudentRate)}`],
        ["Estudiantes con ayudas posteriores a la 8.ª", number(tutor.studentsOverFreeLimit)],
        ["Ayudas posteriores a la 8.ª", number(tutor.extra)], ["Contextuales por reglas", number(tutor.contextual)]]} />
      {tutor.unclassified > 0 && <p className="text-sm text-text-muted">{number(tutor.unclassified)} ayudas históricas con origen sin registrar.</p>}
    </Panel>
    <Panel title="Consejos y resultados" detail="Comparación descriptiva entre victorias con distintos niveles de uso. Las diferencias pueden reflejar dificultad, experiencia previa y otros factores.">
      <Table caption="Estrellas según uso de consejos en la sesión" headers={["Consejos registrados en el periodo", "Victorias verificadas", "Estrellas medias"]}
        rows={tutor.victories.map(row => [row.with_advice ? "Con consejos" : "Sin consejos", number(row.victories), number(row.average_stars)])} />
    </Panel>
  </>;
}

const sections = ["Resumen", "Pensamiento lógico", "Participación", "Uso del tutor"] as const;
export type MetricsSection = typeof sections[number];

export function MetricsSections({ report, institution, section, select }: { report: MetricsReport; institution: boolean; section: MetricsSection; select: (section: MetricsSection) => void }) {
  return <div className="space-y-5">
    <nav className="flex flex-wrap gap-2" aria-label="Secciones de métricas">
      {sections.map(label => <button type="button" key={label} className={label === section ? "btn-premium" : "btn-secondary"} aria-pressed={label === section} onClick={() => select(label)}>{label}</button>)}
    </nav>
    <p className="text-sm text-text-muted">{dateLabel(report.from)} al {dateLabel(report.to)} · {number(report.summary.students)} {report.summary.students === 1 ? "estudiante" : "estudiantes"} en el filtro</p>
    {report.summary.students === 0 && <p role="status" className="rounded-lg border border-border p-4">No hay estudiantes en el alcance seleccionado.</p>}
    {section === "Resumen" && <Summary report={report} institution={institution} />}
    {section === "Pensamiento lógico" && <Dimensions report={report} />}
    {section === "Participación" && <Participation report={report} />}
    {section === "Uso del tutor" && <Tutor tutor={report.tutor} />}
  </div>;
}
