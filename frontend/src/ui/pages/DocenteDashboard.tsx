import { useState } from "react";
import { useDashboardDocente } from "../../application/hooks/useDashboardDocente";
import { aiService } from "../../infrastructure/api/aiService";
import type {
  Ria01PredictRequest,
  Ria03RecommendRequest,
  Ria04DifficultyRequest,
  Ria08AnomalyRequest,
  Ria11TimeRequest,
  RiaInfoResponse,
} from "../../infrastructure/api/models/aiModels";
import { RobotIcon } from "../components/common/RobotIcon";

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



// Componente para el gráfico de barras horizontal (SVG puro)
const HorizontalBarChart = ({
  data,
}: {
  data: { nombre: string; importancia: number }[];
}) => {
  const maxImportancia = Math.max(...data.map((d) => d.importancia));
  const barHeight = 20;
  const barSpacing = 10;
  const width = 500;
  const height = data.length * (barHeight + barSpacing);

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      {data.map((d, index) => {
        const barWidth = (d.importancia / maxImportancia) * (width - 120);
        const y = index * (barHeight + barSpacing);
        return (
          <g key={d.nombre}>
            <rect
              x={120}
              y={y}
              width={barWidth}
              height={barHeight}
              fill="var(--primary)"
              rx={2}
              ry={2}
            />
            <text
              x={115}
              y={y + barHeight / 2 + 5}
              textAnchor="end"
              dominantBaseline="middle"
              className="text-xs font-mono"
              style={{ fill: "var(--text-muted)" }}
            >
              {d.nombre}
            </text>
            <text
              x={120 + barWidth + 5}
              y={y + barHeight / 2 + 5}
              textAnchor="start"
              dominantBaseline="middle"
              className="text-xs font-mono"
              style={{ fill: "var(--text)" }}
            >
              {d.importancia.toFixed(2)}
            </text>
          </g>
        );
      })}
      <line
        x1={120}
        y1={0}
        x2={120}
        y2={height}
        stroke="var(--border)"
        strokeWidth={1}
      />
      <line
        x1={120}
        y1={height}
        x2={width}
        y2={height}
        stroke="var(--border)"
        strokeWidth={1}
      />
      {[0, 0.05, 0.1, 0.15, 0.2, 0.25].map((val) => {
        const x = 120 + (val / maxImportancia) * (width - 120);
        return (
          <text
            key={val}
            x={x}
            y={height + 15}
            textAnchor="middle"
            className="text-xs font-mono"
            style={{ fill: "var(--text-muted)" }}
          >
            {val.toFixed(2)}
          </text>
        );
      })}
      <text
        x={width / 2}
        y={height + 30}
        textAnchor="middle"
        className="text-xs font-mono"
        style={{ fill: "var(--text-muted)" }}
      >
        Importancia
      </text>
    </svg>
  );
};

// --- Constantes y datos de ejemplo para IA ---
const SAMPLE_STUDENTS = [
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
  return (
    <div className="space-y-3">
      {Object.entries(r).map(([key, val]) => (
        <div key={key} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider min-w-[160px]" style={{ color: "var(--text-muted)" }}>
            {key}
          </span>
          <span className="text-xs font-mono font-semibold" style={{ color: "var(--text)" }}>
            {typeof val === "boolean" ? (val ? "Sí" : "No") : String(val ?? "-")}
          </span>
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

export const DocenteDashboard = () => {
  const { dashboardData, loading, error } = useDashboardDocente();
  const dataToShow = error
    ? mockDashboardData
    : dashboardData || mockDashboardData;

  const [activeTab, setActiveTab] = useState<TabId>("ria01");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [result, setResult] = useState<unknown>(null);
  const [consultLoading, setConsultLoading] = useState(false);
  const [consultError, setConsultError] = useState<string | null>(null);
  const [modelInfo, setModelInfo] = useState<RiaInfoResponse | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [modelInfoLoading, setModelInfoLoading] = useState(false);

  const activeTabData = TABS.find((t) => t.id === activeTab)!;

  const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedStudentId(id);
    setResult(null);
    setConsultError(null);
    setModelInfo(null);
    setShowInfo(false);
    if (id) {
      const student = SAMPLE_STUDENTS.find((s) => s.id === id);
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
          <span className="material-symbols-outlined text-sm">add_circle</span>
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
      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 border border-border bg-surface rounded-lg">
        <label className="text-xs font-mono font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Estudiante
        </label>
        <select
          value={selectedStudentId}
          onChange={handleStudentChange}
          className="flex-1 min-w-[200px] bg-bg border border-border px-3 py-2 text-xs font-mono outline-none focus:border-primary transition-all rounded-md"
          style={{ color: "var(--text)" }}
        >
          <option value="">Seleccionar estudiante...</option>
          {SAMPLE_STUDENTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <span className="text-[9px] font-mono italic" style={{ color: "var(--text-muted)" }}>
          Los datos se cargarán automáticamente al seleccionar
        </span>
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
      <div className="border border-border bg-surface p-6 mb-6 transition-all duration-300 rounded-t-none rounded-b-lg -mt-px">
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider mb-6" style={{ color: "var(--text)" }}>
          {activeTabData.label}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {activeTabData.fields.map((field) => (
            <div key={field.key}>
              <label
                className="block text-[10px] font-mono font-bold uppercase tracking-wider mb-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                {field.label}
              </label>
              {field.type === "select" ? (
                <select
                  value={String(formData[field.key as keyof typeof formData] ?? "")}
                  onChange={(e) => setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  className="w-full bg-bg border border-border px-3 py-2 text-xs font-mono outline-none focus:border-primary transition-all rounded-md"
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
                  className="w-full bg-bg border border-border px-3 py-2 text-xs font-mono outline-none focus:border-primary transition-all rounded-md"
                  style={{ color: "var(--text)" }}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleConsult}
            disabled={consultLoading}
            className="bg-primary text-bg px-6 py-3 font-mono font-bold uppercase tracking-wider text-xs hover:opacity-90 transition-all duration-300 hover:scale-105 flex items-center gap-2 shrink-0 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="px-4 py-3 text-[10px] font-mono font-bold uppercase tracking-wider border border-border text-text-muted hover:text-text hover:border-primary/30 transition-all duration-300 rounded-lg"
          >
            {showInfo ? "Ocultar info del modelo" : "Ver info del modelo"}
          </button>

          {consultError && (
            <span className="text-xs font-mono text-red-500 ml-auto">
              {consultError}
            </span>
          )}
        </div>
      </div>

      {/* Resultado */}
      {result && (
        <div className="border border-border bg-surface p-6 mb-6 transition-all duration-300 rounded-lg">
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider mb-4" style={{ color: "var(--text)" }}>
            Resultado
          </h3>
          <ResultDisplay result={result} activeTab={activeTab} />
        </div>
      )}

      {/* Model Info */}
      {showInfo && (
        <div className="border border-border bg-surface p-6 mb-6 transition-all duration-300 rounded-lg">
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider mb-4" style={{ color: "var(--text)" }}>
            Información del Modelo
          </h3>
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
      )}
    </main>
  );
};
