import { useState, useEffect } from "react";
import { aiService } from "../../infrastructure/api/aiService";
import { apiService } from "../../infrastructure/api/apiService";
import type { Ria01PredictRequest, RiaInfoResponse } from "../../infrastructure/api/models/aiModels";
import type { RankingDTO } from "../../infrastructure/api/models/apiModels";

interface StudentFeatures {
  id: string;
  name: string;
  attempts: number;
  errors: number;
  logical_level: string;
  ai_interactions: number;
  inactive_days: number;
  score: number;
  success_rate: number;
  help_requested: number;
  completed_activities: number;
  age: number;
  grade: number;
  rankingPosition: number;
}

const deriveFeaturesFromRanking = (id: string, position: number, totalPoints: number): StudentFeatures => {
  const score = totalPoints ?? 75;
  const attempts = Math.round(score / 20) + 2;
  const logical_level = score > 75 ? "alto" : score > 45 ? "medio" : "bajo";
  return {
    id,
    name: `Estudiante #${position}`,
    attempts,
    errors: Math.max(0, Math.round(attempts * (1 - score / 100))),
    logical_level,
    ai_interactions: Math.round(score / 15),
    inactive_days: Math.max(0, 7 - Math.round(score / 15)),
    score,
    success_rate: score / 100,
    help_requested: Math.max(0, 5 - Math.round(score / 20)),
    completed_activities: Math.round(score / 12) + 1,
    age: 13,
    grade: 7,
    rankingPosition: position,
  };
};

const loadDashboardMetrics = async () => {
  try {
    const groups = await apiService.groups.getAll();
    const groupCount = groups?.length ?? 0;
    let studentCount = 0;
    let courseCount = 0;
    if (groups && groups.length > 0) {
      const ranking = await apiService.ranking.getGroupRanking(groups[0].idGroup);
      studentCount = ranking?.length ?? 0;
    }
    try {
      const courses = await apiService.courses.getAll();
      courseCount = courses?.length ?? 0;
    } catch {}
    return {
      metricas: [
        { id: "1", titulo: "Grupos Activos", valor: groupCount, variacion: "", icono: "school" },
        { id: "2", titulo: "Estudiantes", valor: studentCount, variacion: "", icono: "group" },
        { id: "3", titulo: "Cursos", valor: courseCount, variacion: "", icono: "trending_up" },
      ],
      retos: [] as { id: string; nombre: string; categoria: string; dificultad: number; estado: boolean }[],
      estudiantesDestacados: [] as { id: string; nombre: string; xp: number; variacionXP: number; posicion: number; avatar: string }[],
    };
  } catch {
    return {
      metricas: [
        { id: "1", titulo: "Grupos Activos", valor: 0, variacion: "", icono: "school" },
        { id: "2", titulo: "Estudiantes", valor: 0, variacion: "", icono: "group" },
        { id: "3", titulo: "Cursos", valor: 0, variacion: "", icono: "trending_up" },
      ],
      retos: [],
      estudiantesDestacados: [],
    };
  }
};

const StatusBadge = ({ label, level }: { label: string; level: "alto" | "medio" | "bajo" | "positivo" | "negativo" | "normal" }) => {
  const colors: Record<string, string> = { alto: "bg-red-500/10 text-red-500 border-red-500/20", medio: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", bajo: "bg-green-500/10 text-green-500 border-green-500/20", positivo: "bg-green-500/10 text-green-500 border-green-500/20", negativo: "bg-red-500/10 text-red-500 border-red-500/20", normal: "bg-blue-500/10 text-blue-500 border-blue-500/20" };
  return <span className={`text-[10px] font-mono font-bold px-3 py-1.5 border rounded-full ${colors[level] ?? "bg-primary/10 text-primary border-primary/20"}`}>{label}</span>;
};

// --- Interactive Charts ---

const Tooltip = ({ children, x, y, visible }: { children: React.ReactNode; x: number; y: number; visible: boolean }) => {
  if (!visible) return null;
  return (
    <div
      className="absolute z-50 pointer-events-none px-3 py-2 rounded-lg shadow-xl border text-[10px] font-mono whitespace-nowrap"
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, -120%)",
        backgroundColor: "var(--bg)",
        borderColor: "var(--border)",
        color: "var(--text)",
      }}
    >
      {children}
      <svg width="8" height="4" className="absolute left-1/2 -translate-x-1/2 -bottom-1" style={{ color: "var(--bg)" }}>
        <polygon points="0,0 4,4 8,0" fill="var(--bg)" stroke="var(--border)" strokeWidth="0.5" />
      </svg>
    </div>
  );
};

const ScatterChart = ({
  data,
  width = 400,
  height = 220,
}: {
  data: { label: string; x: number; y: number; group: "normal" | "anomaly"; detail?: string }[];
  width?: number;
  height?: number;
}) => {
  const maxX = Math.max(...data.map((d) => d.x), 10);
  const maxY = Math.max(...data.map((d) => d.y), 10);
  const pad = { t: 20, r: 20, b: 40, l: 50 };
  const plotW = width - pad.l - pad.r;
  const plotH = height - pad.t - pad.b;
  const [tooltip, setTooltip] = useState<{ d: typeof data[0]; px: number; py: number } | null>(null);

  return (
    <div className="relative">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = pad.t + plotH * (1 - frac);
          return (
            <g key={frac}>
              <line x1={pad.l} y1={y} x2={width - pad.r} y2={y} stroke="var(--border)" strokeWidth="0.5" opacity={0.3} />
              <text x={pad.l - 8} y={y + 3} textAnchor="end" className="text-[8px] font-mono" fill="var(--text-muted)">{(maxY * frac).toFixed(0)}</text>
            </g>
          );
        })}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const x = pad.l + plotW * frac;
          return (
            <text key={frac} x={x} y={height - 10} textAnchor="middle" className="text-[8px] font-mono" fill="var(--text-muted)">{(maxX * frac).toFixed(0)}</text>
          );
        })}
        {data.map((d, i) => {
          const cx = pad.l + (d.x / maxX) * plotW;
          const cy = pad.t + plotH * (1 - d.y / maxY);
          const isAnomaly = d.group === "anomaly";
          return (
            <g key={i}>
              <circle
                cx={cx} cy={cy} r={isAnomaly ? 7 : 5}
                fill={isAnomaly ? "#ef4444" : "var(--primary)"}
                opacity={0.8}
                stroke={isAnomaly ? "#ef4444" : "var(--primary)"}
                strokeWidth={tooltip?.d === d ? 3 : 1}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => {
                  setTooltip({ d, px: cx, py: cy });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
              {isAnomaly && (
                <line x1={cx - 3} y1={cy - 3} x2={cx + 3} y2={cy + 3} stroke="#fff" strokeWidth="1.5" opacity={0.9} />
              )}
            </g>
          );
        })}
        <text x={width / 2} y={height - 2} textAnchor="middle" className="text-[9px] font-mono" fill="var(--text-muted)">Errores</text>
        <text x={10} y={height / 2} textAnchor="middle" transform={`rotate(-90, 10, ${height / 2})`} className="text-[9px] font-mono" fill="var(--text-muted)">Score</text>
      </svg>
      {tooltip && (
        <Tooltip x={tooltip.px} y={tooltip.py} visible>
          <div className="space-y-0.5">
            <p className="font-bold text-[11px]">{tooltip.d.label}</p>
            <p>Score: {tooltip.d.y.toFixed(1)} · Errores: {tooltip.d.x.toFixed(0)}</p>
            {tooltip.d.detail && <p className="opacity-60">{tooltip.d.detail}</p>}
          </div>
        </Tooltip>
      )}
    </div>
  );
};

const RadarChart = ({
  data,
  size = 180,
}: {
  data: { label: string; value: number; max: number }[];
  size?: number;
}) => {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.35;
  const levels = 4;
  const angleStep = (2 * Math.PI) / data.length;
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const getPoint = (index: number, value: number, max: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / max) * radius;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const dataPoints = data.map((d, i) => getPoint(i, d.value, d.max));
  const pointsStr = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      {Array.from({ length: levels }).map((_, level) => {
        const r = (radius * (level + 1)) / levels;
        const pts = data.map((_, i) => {
          const angle = angleStep * i - Math.PI / 2;
          return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
        }).join(" ");
        return <polygon key={level} points={pts} fill="none" stroke="var(--border)" strokeWidth="0.5" opacity={0.4} />;
      })}
      {data.map((_, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const x2 = cx + radius * Math.cos(angle);
        const y2 = cy + radius * Math.sin(angle);
        return <line key={i} x1={cx} y1={cy} x2={x2} y2={y2} stroke="var(--border)" strokeWidth="0.5" opacity={0.3} />;
      })}
      <polygon points={pointsStr} fill="var(--primary)" fillOpacity={0.15} stroke="var(--primary)" strokeWidth="1.5" />
      {data.map((d, i) => {
        const p = dataPoints[i];
        const isHovered = hoverIdx === i;
        return (
          <g key={i}>
            <circle
              cx={p.x} cy={p.y} r={isHovered ? 5 : 3}
              fill="var(--primary)" stroke="var(--bg)" strokeWidth="1.5"
              className="transition-all duration-200 cursor-pointer"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
            />
            <text
              x={cx + (radius + 20) * Math.cos(angleStep * i - Math.PI / 2)}
              y={cy + (radius + 20) * Math.sin(angleStep * i - Math.PI / 2)}
              textAnchor="middle" dominantBaseline="middle"
              className="text-[8px] font-mono font-bold"
              fill={isHovered ? "var(--primary)" : "var(--text-muted)"}
            >
              {d.label}
            </text>
            {isHovered && (
              <text
                x={p.x} y={p.y - 10}
                textAnchor="middle"
                className="text-[10px] font-mono font-bold"
                fill="var(--primary)"
              >
                {d.value.toFixed(1)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

const DonutChart = ({
  segments,
  size = 140,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}) => {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.35;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  let cumAngle = -Math.PI / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      {segments.map((seg, i) => {
        const frac = seg.value / total;
        const angle = frac * 2 * Math.PI;
        const largeArc = angle > Math.PI ? 1 : 0;
        const x1 = cx + r * Math.cos(cumAngle);
        const y1 = cy + r * Math.sin(cumAngle);
        const x2 = cx + r * Math.cos(cumAngle + angle);
        const y2 = cy + r * Math.sin(cumAngle + angle);
        const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
        const isHovered = hoverIdx === i;
        cumAngle += angle;
        return (
          <g key={i}>
            <path
              d={path}
              fill={seg.color}
              opacity={isHovered ? 1 : 0.7}
              stroke="var(--bg)"
              strokeWidth="1"
              className="transition-all duration-200 cursor-pointer"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
            />
          </g>
        );
      })}
      {hoverIdx !== null && segments[hoverIdx] && (
        <>
          <text x={cx} y={cy - 6} textAnchor="middle" className="text-[11px] font-mono font-bold" fill="var(--text)">
            {((segments[hoverIdx].value / total) * 100).toFixed(0)}%
          </text>
          <text x={cx} y={cy + 8} textAnchor="middle" className="text-[7px] font-mono" fill="var(--text-muted)">
            {segments[hoverIdx].label}
          </text>
        </>
      )}
      {hoverIdx === null && (
        <>
          <text x={cx} y={cy - 6} textAnchor="middle" className="text-[11px] font-mono font-bold" fill="var(--text)">
            {total.toFixed(0)}
          </text>
          <text x={cx} y={cy + 8} textAnchor="middle" className="text-[7px] font-mono" fill="var(--text-muted)">
            total
          </text>
        </>
      )}
    </svg>
  );
};



const ResultDisplay = ({ result }: { result: unknown }) => {
  const r = result as Record<string, unknown>;
  const score = typeof r.score === "number" ? r.score : typeof r.prediccion === "string" ? { bajo: 30, medio: 60, alto: 90 }[r.prediccion.toLowerCase()] ?? 50 : 50;
  const radarData = [
    { label: "Score", value: score as number, max: 100 },
    { label: "Éxito", value: (typeof r.success_rate === "number" ? r.success_rate : 0.5) * 100, max: 100 },
    { label: "Intentos", value: Math.min((typeof r.attempts === "number" ? r.attempts : 5) * 15, 100), max: 100 },
    { label: "Interac.", value: Math.min((typeof r.ai_interactions === "number" ? r.ai_interactions : 5) * 12, 100), max: 100 },
    { label: "Complet.", value: Math.min((typeof r.completed_activities === "number" ? r.completed_activities : 5) * 18, 100), max: 100 },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="flex flex-col items-center gap-4 p-6 bg-bg/40 border border-border/20 rounded-xl">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Desempeño General</p>
          <span className="text-2xl font-mono font-bold" style={{ color: score > 75 ? "var(--primary)" : score > 40 ? "#f59e0b" : "#ef4444" }}>{score}%</span>
          <StatusBadge label={score > 75 ? "Alto" : score > 40 ? "Medio" : "Bajo"} level={score > 75 ? "positivo" : score > 40 ? "medio" : "alto"} />
        </div>
        <div className="flex flex-col items-center p-6 bg-bg/40 border border-border/20 rounded-xl">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Dimensiones</p>
          <RadarChart data={radarData} size={240} />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Object.entries(r).map(([key, val]) => (
          <div key={key} className="bg-bg/40 border border-border/20 p-3 rounded-lg text-center">
            <span className="block text-[8px] font-mono uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>{key}</span>
            <span className="text-sm font-mono font-bold" style={{ color: "var(--text)" }}>{String(val ?? "-")}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ModelInfoDisplay = ({ info }: { info: RiaInfoResponse }) => {
  return (
    <div className="space-y-6">
      {info.modelo && (
        <div className="flex items-center gap-4 pb-4 border-b border-border/30">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider min-w-[120px]" style={{ color: "var(--text-muted)" }}>Modelo</span>
          <span className="text-xs font-mono font-semibold" style={{ color: "var(--text)" }}>{info.modelo}</span>
        </div>
      )}
      {info.version && (
        <div className="flex items-center gap-4 pb-4 border-b border-border/30">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider min-w-[120px]" style={{ color: "var(--text-muted)" }}>Versión</span>
          <span className="text-xs font-mono font-semibold" style={{ color: "var(--text)" }}>{info.version}</span>
        </div>
      )}
      {info.estado && (
        <div className="flex items-center gap-4 pb-4 border-b border-border/30">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider min-w-[120px]" style={{ color: "var(--text-muted)" }}>Estado</span>
          <span className="text-xs font-mono font-semibold" style={{ color: "var(--text)" }}>{info.estado}</span>
        </div>
      )}
      {info.metricas && Object.keys(info.metricas).length > 0 && (
        <div>
          <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Métricas</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(info.metricas).map(([key, val]) => (
              <div key={key} className="bg-bg/50 border border-border/30 p-3 rounded-md">
                <span className="block text-[9px] font-mono uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>{key}</span>
                <span className="text-sm font-mono font-bold" style={{ color: "var(--primary)" }}>{typeof val === "number" ? val.toFixed(4) : String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {info.features && info.features.length > 0 && (
        <div>
          <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Features</h4>
          <div className="flex flex-wrap gap-2">
            {info.features.map((f) => (
              <span key={f} className="text-[10px] font-mono border border-border/30 px-2 py-1 rounded-md" style={{ color: "var(--text)" }}>{f}</span>
            ))}
          </div>
        </div>
      )}
      {info.umbrales && Object.keys(info.umbrales).length > 0 && (
        <div>
          <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Umbrales</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(info.umbrales).map(([key, val]) => (
              <div key={key} className="bg-bg/50 border border-border/30 p-3 rounded-md">
                <span className="block text-[9px] font-mono uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>{key}</span>
                <span className="text-sm font-mono font-bold" style={{ color: "var(--primary)" }}>{String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {info.ratio_anomalias !== undefined && (
        <div className="flex items-center gap-4 pb-4 border-b border-border/30">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider min-w-[120px]" style={{ color: "var(--text-muted)" }}>Ratio Anomalías</span>
          <span className="text-xs font-mono font-semibold" style={{ color: "var(--text)" }}>{(info.ratio_anomalias * 100).toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
};

export const DocenteDashboard = () => {
  const [dashboardMetrics, setDashboardMetrics] = useState<{
    metricas: { id: string; titulo: string; valor: string | number; variacion: string; icono: string }[];
    retos: { id: string; nombre: string; categoria: string; dificultad: number; estado: boolean }[];
    estudiantesDestacados: { id: string; nombre: string; xp: number; variacionXP: number; posicion: number; avatar: string }[];
  }>({ metricas: [], retos: [], estudiantesDestacados: [] });
  const [metricsReady, setMetricsReady] = useState(false);

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [students, setStudents] = useState<StudentFeatures[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [result, setResult] = useState<unknown>(null);
  const [consultLoading, setConsultLoading] = useState(false);
  const [consultError, setConsultError] = useState<string | null>(null);
  const [modelInfo, setModelInfo] = useState<RiaInfoResponse | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [modelInfoLoading, setModelInfoLoading] = useState(false);

  useEffect(() => {
    loadDashboardMetrics().then((data) => {
      setDashboardMetrics(data);
      setMetricsReady(true);
    });
  }, []);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const groups = await apiService.groups.getAll();
        if (!groups || groups.length === 0) throw new Error("No hay grupos");
        const ranking = await apiService.ranking.getGroupRanking(groups[0].idGroup);
        if (ranking && ranking.length > 0) {
          const derived = ranking.map((s: RankingDTO, i: number) =>
            deriveFeaturesFromRanking(s.idStudent, s.position || i + 1, s.totalPoints ?? 50)
          );
          setStudents(derived);
          if (!selectedStudentId) {
            setSelectedStudentId(derived[0].id);
          }
        }
      } catch {
        setStudents([]);
      } finally {
        setStudentsLoading(false);
      }
    };
    loadStudents();
  }, []);

  const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStudentId(e.target.value);
    setResult(null);
    setConsultError(null);
    setModelInfo(null);
    setShowInfo(false);
  };

  const handleToggleInfo = async () => {
    if (showInfo) { setShowInfo(false); return; }
    setShowInfo(true);
    if (!modelInfo) {
      setModelInfoLoading(true);
      try {
        const info = await aiService.getRia01Info();
        setModelInfo(info);
      } catch {
        setModelInfo(null);
      } finally {
        setModelInfoLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!selectedStudentId || students.length === 0) return;
    setConsultLoading(true);
    setConsultError(null);
    setResult(null);
    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) return;
    const form: Ria01PredictRequest = {
      attempts: student.attempts,
      errors: student.errors,
      logical_level: student.logical_level,
      ai_interactions: student.ai_interactions,
    };
    aiService.predictRia01(form)
      .then(setResult)
      .catch((err) => setConsultError(err instanceof Error ? err.message : "Error"))
      .finally(() => setConsultLoading(false));
  }, [selectedStudentId, students]);

  if (!metricsReady && studentsLoading)
    return (
      <div
        className="flex-1 flex items-center justify-center font-mono text-xs"
        style={{ color: "var(--text-muted)" }}
      >
        Cargando datos...
      </div>
    );

  return (
    <main
      className="flex-1 flex flex-col p-6 max-w-[1280px] mx-auto w-full"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1
            className="text-xl font-mono font-bold tracking-tight mb-1 transition-all duration-300 hover:text-primary"
            style={{ color: "var(--text)" }}
          >
            Panel del Instructor
          </h1>
          <p
            className="text-sm transition-all duration-300"
            style={{ color: "var(--text-muted)" }}
          >
            Gestión de retos, estudiantes y seguimiento de progreso
          </p>
        </div>
        <button className="bg-primary text-bg px-6 py-3 font-mono font-bold uppercase tracking-wider text-xs hover:opacity-90 transition-all duration-300 hover:scale-105 flex items-center gap-2 shrink-0 rounded-lg">
          <span className="material-symbols-outlined text-sm">add_circle</span>
          Nuevo Reto
        </button>
      </div>

      {/* Métricas originales (Retos Activos, Estudiantes, Progreso Global) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {dashboardMetrics.metricas.map((m) => (
          <div
            key={m.id}
            className="border border-border bg-surface p-6 transition-all duration-300 hover:shadow-lg hover:scale-102 rounded-lg"
          >
            <div className="flex justify-between items-start mb-4">
              <span
                className="material-symbols-outlined text-2xl transition-colors duration-300"
                style={{ color: "var(--primary)" }}
              >
                {m.icono}
              </span>
              <span
                className="font-mono text-xs transition-colors duration-300"
                style={{ color: "var(--primary)" }}
              >
                {m.variacion}
              </span>
            </div>
            <p
              className="text-xs font-mono uppercase tracking-wider mb-1 transition-colors duration-300"
              style={{ color: "var(--text-muted)" }}
            >
              {m.titulo}
            </p>
            <p
              className="text-3xl font-mono font-bold transition-colors duration-300"
              style={{ color: "var(--text)" }}
            >
              {m.valor}
            </p>
          </div>
        ))}
      </div>

      {/* Main grid (Retos y Mejores Estudiantes) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Retos table */}
        <div className="lg:col-span-8 border border-border bg-surface p-6 transition-all duration-300 rounded-lg">
          <h2
            className="text-sm font-mono font-bold uppercase tracking-wider mb-6 transition-colors duration-300 pb-2"
            style={{
              color: "var(--text)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            Retos Activos
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr
                  className="text-xs uppercase tracking-wider border-b"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text-muted)",
                  }}
                >
                  <th className="pb-3 font-normal">Nombre</th>
                  <th className="pb-3 font-normal">Categoría</th>
                  <th className="pb-3 font-normal">Nivel</th>
                  <th className="pb-3 font-normal text-center">Estado</th>
                  <th className="pb-3 font-normal text-right">Acciones</th>
                </tr>
              </thead>
              <tbody
                className="divide-y"
                style={{ borderColor: "rgba(var(--border-rgb), 0.3)" }}
              >
                {dashboardMetrics.retos.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-surface/30 transition-colors duration-300 rounded-lg"
                  >
                    <td
                      className="py-4 font-mono text-xs font-semibold"
                      style={{ color: "var(--text)" }}
                    >
                      {r.nombre}
                    </td>
                    <td className="py-4">
                      <span
                        className="text-xs font-mono border border-border px-2 py-0.5 rounded-md"
                        style={{
                          color: "var(--text-muted)",
                          borderColor: "var(--border)",
                        }}
                      >
                        {r.categoria}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex gap-1">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            style={{
                              width: "12px",
                              height: "12px",
                              borderRadius: "2px",
                              backgroundColor:
                                i <= r.dificultad
                                  ? "var(--primary)"
                                  : "var(--border)",
                            }}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      <span
                        className={`text-xs font-mono px-2 py-1 rounded-full ${
                          r.estado
                            ? "bg-green-500/10 text-green-500"
                            : "bg-yellow-500/10 text-yellow-500"
                        }`}
                      >
                        {r.estado ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="text-text-muted hover:text-primary transition-colors duration-300 rounded-full p-1">
                          <span className="material-symbols-outlined text-base">
                            edit
                          </span>
                        </button>
                        <button className="text-text-muted hover:text-red-500 transition-colors duration-300 rounded-full p-1">
                          <span className="material-symbols-outlined text-base">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top students */}
        <div className="lg:col-span-4 border border-border bg-surface p-6 transition-all duration-300 hover:shadow-lg rounded-lg">
          <h2
            className="text-sm font-mono font-bold uppercase tracking-wider mb-6 transition-colors duration-300"
            style={{ color: "var(--text)" }}
          >
            Mejores Estudiantes
          </h2>
          <div className="space-y-4">
            {dashboardMetrics.estudiantesDestacados.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-4 p-3 border border-border/50 transition-all duration-300 hover:shadow-sm rounded-lg"
              >
                <div className="relative shrink-0">
                  <img
                    alt={e.nombre}
                    className="w-10 h-10 object-cover border border-border rounded-md"
                    src={e.avatar}
                  />
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center font-bold text-[10px] rounded-full text-bg"
                    style={{ backgroundColor: "var(--primary)" }}
                  >
                    {e.posicion}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-semibold transition-colors duration-300"
                    style={{ color: "var(--text)" }}
                  >
                    {e.nombre}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="flex-1 h-1 rounded-full"
                      style={{
                        backgroundColor: "var(--border)",
                        opacity: 0.3,
                      }}
                    >
                      <div
                        className="h-full transition-all duration-500 rounded-full"
                        style={{
                          width: `${(e.xp / 5000) * 100}%`,
                          backgroundColor: "var(--primary)",
                        }}
                      />
                    </div>
                    <span
                      className="text-[10px] font-mono transition-colors duration-300"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {e.xp} XP
                    </span>
                  </div>
                </div>
                <span
                  className="text-xs font-mono transition-colors duration-300"
                  style={{ color: "var(--primary)" }}
                >
                  +{e.variacionXP}
                </span>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-3 border border-dashed border-border text-text-muted hover:text-primary hover:border-primary transition-all duration-300 text-xs font-mono uppercase tracking-wider rounded-lg">
            Ver ranking completo
          </button>
        </div>
      </div>

      {/* --- SECCIÓN DE ANALÍTICA IA CON TABS --- */}
      <div className="border-t border-border my-8" />

      <div className="mb-6">
        <h2
          className="text-xl font-mono font-bold tracking-tight mb-2"
          style={{ color: "var(--text)" }}
        >
          Dashboard de Resultados IA
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Análisis de desempeño basado en inteligencia artificial
        </p>
      </div>

      {/* Selector de Estudiante */}
      <div className="mb-8 p-5 border border-border bg-surface rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg border border-border/50 flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Estudiante
            </span>
          </div>
          <div className="flex-1 min-w-[200px] relative">
            <select
              value={selectedStudentId}
              onChange={handleStudentChange}
              disabled={studentsLoading}
              className="w-full bg-bg border border-border px-10 py-2.5 text-xs font-mono outline-none focus:border-primary transition-all rounded-lg disabled:opacity-50 appearance-none"
              style={{ color: "var(--text)" }}
            >
              <option value="">{studentsLoading ? "Cargando estudiantes..." : "Seleccionar estudiante..."}</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            {studentsLoading && (
              <div className="absolute right-10 top-1/2 -translate-y-1/2">
                <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <span className="text-[9px] font-mono italic shrink-0" style={{ color: "var(--text-muted)" }}>
            {students.length > 0 ? "Sincronizado" : "Sin datos"}
          </span>
        </div>
        {selectedStudentId && (() => {
          const s = students.find(st => st.id === selectedStudentId);
          if (!s) return null;
          return (
            <div className="mt-4 pt-4 border-t border-border/30 flex flex-wrap gap-4 sm:gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-border/50 flex items-center justify-center font-mono text-xs font-bold" style={{ backgroundColor: "var(--bg)", color: "var(--primary)" }}>
                  {s.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-mono font-semibold" style={{ color: "var(--text)" }}>{s.name}</p>
                  <p className="text-[9px] font-mono" style={{ color: "var(--text-muted)" }}>ID: {s.id}</p>
                </div>
              </div>
              <div className="flex gap-4 sm:gap-6 flex-wrap text-[10px] font-mono">
                <div><span style={{ color: "var(--text-muted)" }}>Score </span><span className="font-bold" style={{ color: "var(--primary)" }}>{s.score}</span></div>
                <div><span style={{ color: "var(--text-muted)" }}>Intentos </span><span className="font-bold" style={{ color: "var(--text)" }}>{s.attempts}</span></div>
                <div><span style={{ color: "var(--text-muted)" }}>Éxito </span><span className="font-bold" style={{ color: s.success_rate > 0.75 ? "#22c55e" : "#f59e0b" }}>{(s.success_rate * 100).toFixed(0)}%</span></div>
                <div><span style={{ color: "var(--text-muted)" }}>Nivel </span><span className="font-bold capitalize" style={{ color: "var(--text)" }}>{s.logical_level}</span></div>
              </div>
            </div>
          );
        })()}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <button
          onClick={handleToggleInfo}
          className="px-5 py-3 text-[10px] font-mono font-bold uppercase tracking-wider border border-border/60 hover:border-primary/30 text-text-muted hover:text-text transition-all duration-300 rounded-lg self-start"
        >
          <span className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            {showInfo ? "Ocultar info" : "Info del modelo"}
          </span>
        </button>
        {consultError && (
          <span className="text-xs font-mono text-red-500 flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            {consultError}
          </span>
        )}
      </div>

      <div className="space-y-6 mt-8">
        {/* Resultado */}
      {result !== null && (
        <div className="border border-border/80 bg-surface transition-all duration-300 rounded-xl overflow-hidden animate-fade-in-soft">
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border/30">
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider" style={{ color: "var(--text)" }}>
                Resultado
              </h3>
            </div>
            <span className="text-[9px] font-mono italic" style={{ color: "var(--text-muted)" }}>
              {students.find(s => s.id === selectedStudentId)?.name ?? "Estudiante"}
            </span>
          </div>
          <div className="p-5 sm:p-6">
            <ResultDisplay result={result} />
          </div>
        </div>
      )}

      {/* Model Info */}
      {showInfo && (
        <div className="border border-border/80 bg-surface transition-all duration-300 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border/30">
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider" style={{ color: "var(--text)" }}>
                Información del Modelo
              </h3>
            </div>
            <button onClick={handleToggleInfo} className="text-[9px] font-mono text-text-muted hover:text-text transition-colors">
              Cerrar
            </button>
          </div>
          <div className="p-5 sm:p-6">
            {modelInfoLoading ? (
              <div className="flex items-center gap-3 py-4">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>Cargando información del modelo...</span>
              </div>
            ) : modelInfo ? (
              <ModelInfoDisplay info={modelInfo} />
            ) : (
              <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                Auto-consulta al seleccionar estudiante.
              </p>
            )}
          </div>
        </div>
      )}
      </div>
    </main>
  );
};
