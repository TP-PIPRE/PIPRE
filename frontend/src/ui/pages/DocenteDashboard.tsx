import { useState, useEffect } from "react";
import { useDashboardDocente } from "../../application/hooks/useDashboardDocente";
import { aiService } from "../../infrastructure/api/aiService";
import { apiService } from "../../infrastructure/api/apiService";
import type {
  Ria01PredictRequest,
  Ria03RecommendRequest,
  Ria04DifficultyRequest,
  Ria08AnomalyRequest,
  Ria11TimeRequest,
  RiaInfoResponse,
} from "../../infrastructure/api/models/aiModels";
import { RobotIcon } from "../components/common/RobotIcon";
import {
  BsPlusCircleFill,
  BsMortarboardFill,
  BsPeopleFill,
  BsGraphUpArrow,
  BsPencilSquare,
  BsTrashFill
} from "react-icons/bs";
import type { RankingDTO } from "../../infrastructure/api/models/apiModels";

// Mock original (retos, estudiantes, métricas)
const mockDashboardData = {
  metricas: [
    {
      id: "1",
      titulo: "Retos Activos",
      valor: 12,
      variacion: "+2",
      icono: "school",
    },
    {
      id: "2",
      titulo: "Estudiantes",
      valor: 120,
      variacion: "+15",
      icono: "group",
    },
    {
      id: "3",
      titulo: "Progreso Global",
      valor: "78%",
      variacion: "↑",
      icono: "trending_up",
    },
  ],
  retos: [
    {
      id: "1",
      nombre: "Chatbot Educativo",
      categoria: "ML",
      dificultad: 2,
      estado: true,
    },
    {
      id: "2",
      nombre: "Brazo Robótico v2",
      categoria: "Robótica",
      dificultad: 3,
      estado: true,
    },
    {
      id: "3",
      nombre: "Debate: Ética IA",
      categoria: "Ética",
      dificultad: 1,
      estado: false,
    },
  ],
  estudiantesDestacados: [
    {
      id: "1",
      nombre: "Lucía Mendez",
      xp: 4850,
      variacionXP: 120,
      posicion: 1,
      avatar: "https://ui-avatars.com/api/?name=Lucia+Mendez&background=random",
    },
    {
      id: "2",
      nombre: "Mateo Rivera",
      xp: 4120,
      variacionXP: 85,
      posicion: 2,
      avatar: "https://ui-avatars.com/api/?name=Mateo+Rivera&background=random",
    },
    {
      id: "3",
      nombre: "Sofía Chen",
      xp: 3980,
      variacionXP: 40,
      posicion: 3,
      avatar: "https://ui-avatars.com/api/?name=Sofia+Chen&background=random",
    },
  ],
};



// --- Constantes y datos de ejemplo para IA (fallback) ---
const FALLBACK_STUDENTS = [
  {
    id: "1",
    name: "Lucía Méndez",
    data: {
      attempts: 4, errors: 2, logical_level: "medio", ai_interactions: 7,
      inactive_days: 4, score: 78.5, success_rate: 0.82, help_requested: 2,
      completed_activities: 6, age: 12, grade: 6,
    },
  },
  {
    id: "2",
    name: "Mateo Rivera",
    data: {
      attempts: 6, errors: 4, logical_level: "alto", ai_interactions: 12,
      inactive_days: 2, score: 92.0, success_rate: 0.95, help_requested: 0,
      completed_activities: 9, age: 14, grade: 8,
    },
  },
  {
    id: "3",
    name: "Sofía Chen",
    data: {
      attempts: 3, errors: 5, logical_level: "bajo", ai_interactions: 3,
      inactive_days: 8, score: 45.0, success_rate: 0.55, help_requested: 5,
      completed_activities: 3, age: 10, grade: 4,
    },
  },
  {
    id: "4",
    name: "Marcos Soto",
    data: {
      attempts: 5, errors: 1, logical_level: "medio", ai_interactions: 9,
      inactive_days: 1, score: 88.0, success_rate: 0.90, help_requested: 1,
      completed_activities: 7, age: 13, grade: 7,
    },
  },
  {
    id: "5",
    name: "Elena García",
    data: {
      attempts: 2, errors: 3, logical_level: "bajo", ai_interactions: 5,
      inactive_days: 6, score: 60.0, success_rate: 0.65, help_requested: 3,
      completed_activities: 4, age: 11, grade: 5,
    },
  },
];

const DEFAULT_FORM = {
  attempts: 4, errors: 2, logical_level: "medio", ai_interactions: 7,
  inactive_days: 3, score: 75.0, success_rate: 0.82, help_requested: 2,
  completed_activities: 5, age: 12, grade: 6,
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

type TabId = "ria01" | "ria03" | "ria04" | "ria08" | "ria11";

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  fields: { key: string; label: string; type: "number" | "select"; step?: number }[];
}

const TABS: TabDef[] = [
  {
    id: "ria01", label: "RIA01 - Desempeño", icon: <RobotIcon size={16} />,
    fields: [
      { key: "attempts", label: "Intentos", type: "number" },
      { key: "errors", label: "Errores", type: "number" },
      { key: "logical_level", label: "Nivel Lógico", type: "select" },
      { key: "ai_interactions", label: "Interacciones IA", type: "number" },
    ],
  },
  {
    id: "ria03", label: "RIA03 - Recomendaciones", icon: <RobotIcon size={16} />,
    fields: [
      { key: "logical_level", label: "Nivel Lógico", type: "select" },
      { key: "inactive_days", label: "Días Inactivo", type: "number" },
      { key: "ai_interactions", label: "Interacciones IA", type: "number" },
      { key: "attempts", label: "Intentos", type: "number" },
    ],
  },
  {
    id: "ria04", label: "RIA04 - Dificultad", icon: <RobotIcon size={16} />,
    fields: [
      { key: "score", label: "Puntaje", type: "number", step: 0.1 },
      { key: "success_rate", label: "Tasa de Éxito", type: "number", step: 0.01 },
      { key: "errors", label: "Errores", type: "number" },
      { key: "attempts", label: "Intentos", type: "number" },
      { key: "help_requested", label: "Ayudas Solicitadas", type: "number" },
      { key: "completed_activities", label: "Actividades Completadas", type: "number" },
      { key: "inactive_days", label: "Días Inactivo", type: "number" },
      { key: "logical_level", label: "Nivel Lógico", type: "select" },
    ],
  },
  {
    id: "ria08", label: "RIA08 - Anomalías", icon: <RobotIcon size={16} />,
    fields: [
      { key: "attempts", label: "Intentos", type: "number" },
      { key: "errors", label: "Errores", type: "number" },
      { key: "score", label: "Puntaje", type: "number", step: 0.1 },
      { key: "inactive_days", label: "Días Inactivo", type: "number" },
    ],
  },
  {
    id: "ria11", label: "RIA11 - Tiempo", icon: <RobotIcon size={16} />,
    fields: [
      { key: "attempts", label: "Intentos", type: "number" },
      { key: "errors", label: "Errores", type: "number" },
      { key: "ai_interactions", label: "Interacciones IA", type: "number" },
      { key: "inactive_days", label: "Días Inactivo", type: "number" },
      { key: "help_requested", label: "Ayudas Solicitadas", type: "number" },
      { key: "completed_activities", label: "Actividades Completadas", type: "number" },
      { key: "age", label: "Edad", type: "number" },
      { key: "grade", label: "Grado", type: "number" },
      { key: "logical_level", label: "Nivel Lógico", type: "select" },
    ],
  },
];

const ResultDisplay = ({ result, activeTab }: { result: unknown; activeTab: TabId }) => {
  const r = result as Record<string, unknown>;
  const firstVal = Object.values(r)[0];

  if (activeTab === "ria01") {
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
  }

  if (activeTab === "ria03") {
    const recs = (Array.isArray(r.recomendaciones) ? r.recomendaciones : Array.isArray(r.actividades) ? r.actividades : Object.values(r).find(Array.isArray) ?? []) as string[];
    return (
      <div className="space-y-6">
        {recs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recs.map((rec, i) => (
              <div
                key={i}
                className="relative flex flex-col p-5 bg-bg/40 border border-border/20 rounded-xl group hover:bg-bg/60 hover:border-primary/30 transition-all duration-200 cursor-pointer"
                onClick={() => navigator.clipboard?.writeText?.(rec)}
              >
                <span className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-primary text-bg flex items-center justify-center text-[11px] font-mono font-bold shadow-md">{i + 1}</span>
                <span className="text-xs font-mono mt-3 leading-relaxed" style={{ color: "var(--text)" }}>{rec}</span>
                <span className="text-[8px] font-mono mt-auto pt-3 opacity-0 group-hover:opacity-40 transition-opacity self-end">copiar</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.entries(r).filter(([, v]) => typeof v === "string" || typeof v === "number").map(([key, val]) => (
              <div key={key} className="bg-bg/40 border border-border/20 p-3 rounded-lg text-center">
                <span className="block text-[8px] font-mono uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>{key}</span>
                <span className="text-sm font-mono font-bold" style={{ color: "var(--text)" }}>{String(val)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (activeTab === "ria04") {
    const level = (r.dificultad as string) ?? (r.nivel as string) ?? String(firstVal ?? "medio");
    const lvl = level.toLowerCase();
    const score = typeof r.score === "number" ? r.score : typeof r.puntaje === "number" ? r.puntaje : 60;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col items-center justify-center gap-6 p-8 bg-bg/40 border border-border/20 rounded-xl">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Nivel de Dificultad</p>
          <div className="relative">
            <svg width="160" height="100" viewBox="0 0 160 100" className="shrink-0">
              <path d="M 15 85 A 65 65 0 0 1 145 85" fill="none" stroke="var(--border)" strokeWidth="12" strokeLinecap="round" />
              <path d="M 15 85 A 65 65 0 0 1 145 85" fill="none" stroke={lvl === "alto" || lvl === "hard" ? "#ef4444" : lvl === "bajo" || lvl === "easy" ? "var(--primary)" : "#f59e0b"} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(score / 100) * 204} 204`} />
              <text x={80} y={75} textAnchor="middle" className="text-2xl font-mono font-bold" fill="var(--text)">{score.toFixed(0)}</text>
              <text x={80} y={90} textAnchor="middle" className="text-[8px] font-mono" fill="var(--text-muted)">puntaje</text>
            </svg>
          </div>
          <StatusBadge label={`Dificultad: ${level}`} level={lvl === "alto" || lvl === "hard" ? "alto" : lvl === "bajo" || lvl === "easy" ? "bajo" : "medio"} />
        </div>
        <div className="grid grid-cols-2 gap-3 content-start">
          {Object.entries(r).map(([key, val]) => (
            <div key={key} className="bg-bg/40 border border-border/20 p-4 rounded-lg">
              <span className="block text-[8px] font-mono uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>{key}</span>
              <span className="text-base font-mono font-bold" style={{ color: "var(--text)" }}>{String(val ?? "-")}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === "ria08") {
    const isAnomaly = r.anomalia === true || r.es_anomalia === true;
    const anomalyScore = typeof r.score === "number" ? r.score : 50;
    const anomalyErrors = typeof r.errors === "number" ? r.errors : typeof r.attempts === "number" ? Math.round(r.attempts * 0.3) : 2;
    const scatterData = [
      { label: "Estudiante actual", x: anomalyErrors, y: anomalyScore, group: isAnomaly ? "anomaly" as const : "normal" as const, detail: isAnomaly ? "Anomalía detectada" : "Comportamiento normal" },
      { label: "Promedio clase", x: 3, y: 72, group: "normal" as const },
      { label: "Límite inferior", x: 6, y: 40, group: "anomaly" as const },
      { label: "Referencia", x: 1, y: 95, group: "normal" as const },
    ];
    return (
      <div className="space-y-6">
        <div className={`flex items-center gap-5 p-6 border rounded-xl ${isAnomaly ? "border-red-500/30 bg-red-500/5" : "border-green-500/30 bg-green-500/5"}`}>
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${isAnomaly ? "bg-red-500/10" : "bg-green-500/10"}`}>
            {isAnomaly ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3L2 21h20L12 3z" /><line x1="12" y1="10" x2="12" y2="15" /><circle cx="12" cy="18" r="0.5" fill="#ef4444" /></svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            )}
          </div>
          <div className="flex-1">
            <p className="text-base font-mono font-bold" style={{ color: isAnomaly ? "#ef4444" : "#22c55e" }}>{isAnomaly ? "Anomalía Detectada" : "Comportamiento Normal"}</p>
            {!!r.detalles && <p className="text-[11px] font-mono mt-1.5" style={{ color: "var(--text-muted)" }}>{String(r.detalles)}</p>}
          </div>
          <StatusBadge label={isAnomaly ? "Requiere atención" : "Todo en orden"} level={isAnomaly ? "negativo" : "positivo"} />
        </div>
        <div className="bg-bg/40 border border-border/20 rounded-xl p-5">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>Detección Visual · Score vs Errores</p>
          <ScatterChart data={scatterData} width={600} height={280} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(r).map(([key, val]) => (
            <div key={key} className="bg-bg/40 border border-border/20 p-3 rounded-lg text-center">
              <span className="block text-[8px] font-mono uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>{key}</span>
              <span className={`text-sm font-mono font-bold ${typeof val === "boolean" ? (val ? "text-red-500" : "text-green-500") : ""}`} style={{ color: typeof val === "boolean" ? undefined : "var(--text)" }}>{typeof val === "boolean" ? (val ? "Sí" : "No") : String(val ?? "-")}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === "ria11") {
    const cls = (r.clasificacion as string) ?? (r.tiempo_estimado as string) ?? String(firstVal ?? "normal");
    const c = cls.toLowerCase();
    const cLevel = c.includes("rápido") || c.includes("rapido") ? "bajo" as const : c.includes("lento") ? "alto" as const : "medio" as const;
    const donutSegments = [
      { label: "Rápido", value: c.includes("rápido") || c.includes("rapido") ? 1 : 0.2, color: "var(--primary)" },
      { label: "Normal", value: cLevel === "medio" ? 1 : 0.4, color: "#f59e0b" },
      { label: "Lento", value: c.includes("lento") ? 1 : 0.15, color: "#ef4444" },
      { label: "Inactivo", value: Math.max(0.05, (typeof r.inactive_days === "number" ? r.inactive_days : 0) * 0.1), color: "var(--border)" },
    ];
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col items-center justify-center gap-6 p-8 bg-bg/40 border border-border/20 rounded-xl">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Distribución de Tiempo</p>
          <DonutChart segments={donutSegments} size={200} />
          <StatusBadge label={`Clasificación: ${cls}`} level={cLevel} />
        </div>
        <div className="grid grid-cols-2 gap-3 content-start">
          {Object.entries(r).map(([key, val]) => (
            <div key={key} className="bg-bg/40 border border-border/20 p-4 rounded-lg">
              <span className="block text-[8px] font-mono uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>{key}</span>
              <span className="text-base font-mono font-bold" style={{ color: "var(--text)" }}>{String(val ?? "-")}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {Object.entries(r).map(([key, val]) => (
        <div key={key} className="bg-bg/40 border border-border/20 p-3 rounded-lg text-center">
          <span className="block text-[8px] font-mono uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>{key}</span>
          <span className="text-sm font-mono font-bold" style={{ color: "var(--text)" }}>{typeof val === "boolean" ? (val ? "Sí" : "No") : String(val ?? "-")}</span>
        </div>
      ))}
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

const renderMetricaIcon = (iconoName: string) => {
  switch (iconoName) {
    case "school":
      return <BsMortarboardFill className="text-2xl transition-colors duration-300" style={{ color: "var(--primary)" }} />;
    case "group":
      return <BsPeopleFill className="text-2xl transition-colors duration-300" style={{ color: "var(--primary)" }} />;
    case "trending_up":
      return <BsGraphUpArrow className="text-2xl transition-colors duration-300" style={{ color: "var(--primary)" }} />;
    default:
      return <BsPlusCircleFill className="text-2xl transition-colors duration-300" style={{ color: "var(--primary)" }} />;
  }
};

export const DocenteDashboard = () => {
  const { dashboardData, loading, error } = useDashboardDocente();
  const dataToShow = error
    ? mockDashboardData
    : dashboardData || mockDashboardData;

  const [activeTab, setActiveTab] = useState<TabId>("ria01");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [students, setStudents] = useState(FALLBACK_STUDENTS);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [result, setResult] = useState<unknown>(null);
  const [consultLoading, setConsultLoading] = useState(false);
  const [consultError, setConsultError] = useState<string | null>(null);
  const [modelInfo, setModelInfo] = useState<RiaInfoResponse | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [modelInfoLoading, setModelInfoLoading] = useState(false);

  useEffect(() => {
    apiService.groups.getAll()
      .then((groups) => {
        if (groups && groups.length > 0) {
          return apiService.ranking.getGroupRanking(groups[0].idGroup);
        }
        throw new Error("No hay grupos disponibles");
      })
      .then((ranking) => {
        if (ranking && ranking.length > 0) {
          setStudents(ranking.map((s: RankingDTO) => ({
            id: s.idStudent,
            name: `Estudiante ${s.position}`,
            data: {
              attempts: Math.round((s.totalPoints ?? 50) / 20) + 2,
              errors: Math.round(3 - (s.totalPoints ?? 50) / 100 * 2),
              logical_level: s.totalPoints > 75 ? "alto" : s.totalPoints > 45 ? "medio" : "bajo",
              ai_interactions: Math.round(Math.max(1, (s.totalPoints ?? 50) / 15)),
              inactive_days: Math.max(0, 7 - Math.round((s.totalPoints ?? 50) / 15)),
              score: s.totalPoints ?? 75,
              success_rate: (s.totalPoints ?? 75) / 100,
              help_requested: Math.max(0, 5 - Math.round((s.totalPoints ?? 50) / 20)),
              completed_activities: Math.round((s.totalPoints ?? 50) / 12) + 1,
              age: 13, grade: 7,
            },
          })));
        }
      })
      .catch(() => {})
      .finally(() => setStudentsLoading(false));
  }, []);

  const activeTabData = TABS.find((t) => t.id === activeTab)!;

  const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedStudentId(id);
    setResult(null);
    setConsultError(null);
    setModelInfo(null);
    setShowInfo(false);
    if (id) {
      const student = students.find((s) => s.id === id);
      if (student) {
        setFormData((prev) => ({ ...prev, ...student.data }));
      }
    }
  };

  const getInfoEndpoint = (): Promise<RiaInfoResponse> => {
    const endpoints = {
      ria01: aiService.getRia01Info(),
      ria03: aiService.getRia03Info(),
      ria04: aiService.getRia04Info(),
      ria08: aiService.getRia08Info(),
      ria11: aiService.getRia11Info(),
    } as const;
    return endpoints[activeTab];
  };

  const handleToggleInfo = async () => {
    if (showInfo) {
      setShowInfo(false);
      return;
    }
    setShowInfo(true);
    if (!modelInfo) {
      setModelInfoLoading(true);
      try {
        const info = await getInfoEndpoint();
        setModelInfo(info);
      } catch {
        setModelInfo(null);
      } finally {
        setModelInfoLoading(false);
      }
    }
  };

  const handleConsult = async () => {
    setConsultLoading(true);
    setConsultError(null);
    setResult(null);
    setModelInfo(null);
    setShowInfo(false);

    try {
      let res: unknown;
      switch (activeTab) {
        case "ria01":
          res = await aiService.predictRia01(formData as Ria01PredictRequest);
          break;
        case "ria03":
          res = await aiService.recommendRia03(formData as Ria03RecommendRequest);
          break;
        case "ria04":
          res = await aiService.adjustDifficultyRia04(formData as Ria04DifficultyRequest);
          break;
        case "ria08":
          res = await aiService.detectAnomalyRia08(formData as Ria08AnomalyRequest);
          break;
        case "ria11":
          res = await aiService.classifyTimeRia11(formData as Ria11TimeRequest);
          break;
      }
      setResult(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al consultar el modelo";
      setConsultError(msg);
    } finally {
      setConsultLoading(false);
    }
  };

  if (loading && !dataToShow)
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
          <BsPlusCircleFill className="text-sm" />
          Nuevo Reto
        </button>
      </div>

      {/* Métricas originales (Retos Activos, Estudiantes, Progreso Global) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {dataToShow.metricas.map((m) => (
          <div
            key={m.id}
            className="border border-border bg-surface p-6 transition-all duration-300 hover:shadow-lg hover:scale-102 rounded-lg"
          >
            <div className="flex justify-between items-start mb-4">
              {renderMetricaIcon(m.icono)}
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
                {dataToShow.retos.map((r) => (
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
                          <BsPencilSquare className="text-base" />
                        </button>
                        <button className="text-text-muted hover:text-red-500 transition-colors duration-300 rounded-full p-1">
                          <BsTrashFill className="text-base" />
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
            {dataToShow.estudiantesDestacados.map((e) => (
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
            {students === FALLBACK_STUDENTS ? "Datos de ejemplo" : "Sincronizado"}
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
                <div><span style={{ color: "var(--text-muted)" }}>Score </span><span className="font-bold" style={{ color: "var(--primary)" }}>{s.data.score}</span></div>
                <div><span style={{ color: "var(--text-muted)" }}>Intentos </span><span className="font-bold" style={{ color: "var(--text)" }}>{s.data.attempts}</span></div>
                <div><span style={{ color: "var(--text-muted)" }}>Éxito </span><span className="font-bold" style={{ color: s.data.success_rate > 0.75 ? "#22c55e" : "#f59e0b" }}>{(s.data.success_rate * 100).toFixed(0)}%</span></div>
                <div><span style={{ color: "var(--text-muted)" }}>Nivel </span><span className="font-bold capitalize" style={{ color: "var(--text)" }}>{s.data.logical_level}</span></div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-0 overflow-x-auto pb-px">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative group flex items-center gap-2 px-4 py-3 text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-200 shrink-0 ${
                isActive
                  ? "bg-surface text-primary border-t border-l border-r border-border rounded-t-lg shadow-[0_-2px_8px_rgba(0,0,0,0.04)] z-10"
                  : "bg-bg/50 text-text-muted border-b border-border hover:text-text hover:bg-surface/60"
              }`}
              style={{
                marginBottom: isActive ? "0px" : undefined,
                borderBottomColor: isActive ? "var(--bg)" : undefined,
              }}
            >
              <span className={isActive ? "opacity-100" : "opacity-50 group-hover:opacity-80 transition-opacity"}>
                {tab.icon}
              </span>
              {tab.label}
              {isActive && (
                <span
                  className="absolute left-0 right-0 bottom-0 h-0.5 rounded-full mx-3"
                  style={{ backgroundColor: "var(--primary)" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Contenido del tab activo */}
      <div className="border border-border bg-surface transition-all duration-300 rounded-xl -mt-px overflow-hidden">
        <div className="p-5 sm:p-6">
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider mb-6" style={{ color: "var(--text)" }}>
            {activeTabData.label}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-6">
            {activeTabData.fields.map((field) => (
              <div key={field.key} className="group">
                <label
                  className="block text-[9px] font-mono font-bold uppercase tracking-wider mb-1.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {field.label}
                </label>
                {field.type === "select" ? (
                  <select
                    value={String(formData[field.key as keyof typeof formData] ?? "")}
                    onChange={(e) => setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full bg-bg border border-border/60 hover:border-border focus:border-primary px-2.5 py-2 text-[11px] font-mono outline-none transition-all rounded-lg"
                    style={{ color: "var(--text)" }}
                  >
                    <option value="bajo">Bajo</option>
                    <option value="medio">Medio</option>
                    <option value="alto">Alto</option>
                  </select>
                ) : (
                  <input
                    type="number"
                    step={field.step ?? 1}
                    value={String(formData[field.key as keyof typeof formData] ?? "")}
                    onChange={(e) => setFormData((prev) => ({ ...prev, [field.key]: field.step ? parseFloat(e.target.value) : parseInt(e.target.value) }))}
                    className="w-full bg-bg border border-border/60 hover:border-border focus:border-primary px-2.5 py-2 text-[11px] font-mono outline-none transition-all rounded-lg"
                    style={{ color: "var(--text)" }}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleConsult}
              disabled={consultLoading}
              className="bg-primary text-bg px-6 py-3 font-mono font-bold uppercase tracking-wider text-xs hover:opacity-90 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 shrink-0 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-primary/20"
            >
              {consultLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-bg border-t-transparent rounded-full animate-spin" />
                  Consultando...
                </>
              ) : (
                <>
                  <RobotIcon size={16} />
                  Consultar
                </>
              )}
            </button>

            <button
              onClick={handleToggleInfo}
              className="px-5 py-3 text-[10px] font-mono font-bold uppercase tracking-wider border border-border/60 hover:border-primary/30 text-text-muted hover:text-text transition-all duration-300 rounded-lg"
            >
              <span className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                {showInfo ? "Ocultar info" : "Info del modelo"}
              </span>
            </button>

            {consultError && (
              <span className="text-xs font-mono text-red-500 sm:ml-auto flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                {consultError}
              </span>
            )}
          </div>
        </div>
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
            <ResultDisplay result={result} activeTab={activeTab} />
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
                Haz clic en "Consultar" primero para ver la información del modelo.
              </p>
            )}
          </div>
        </div>
      )}
      </div>
    </main>
  );
};
