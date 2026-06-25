import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../../infrastructure/api/apiService";
import { getAuthState } from "../../infrastructure/store/authStore";
import { RiaBentoGrid } from "../components/ria-bento-grid/RiaBentoGrid";
import type { RiaStudentData } from "../components/ria-bento-grid/RiaBentoGrid";
import {
  BsPlusCircleFill,
  BsMortarboardFill,
  BsPeopleFill,
  BsGraphUpArrow,
} from "react-icons/bs";
import type { RankingDTO } from "../../infrastructure/api/models/apiModels";
import { Modal } from "../components/common/Modal";

const deriveFeaturesFromRanking = (id: string, position: number, totalPoints: number): RiaStudentData => {
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

const fetchRetosFromActivities = async () => {
  const retos: { id: string; nombre: string; categoria: string; courseId: string; dificultad: number; estado: boolean }[] = [];
  try {
    const courses = await apiService.courses.getAll();
    if (!courses || courses.length === 0) {
      console.warn("[Dashboard] No se encontraron cursos en la API, intentando fallback simulations...");
      return await fetchRetosFromSimulations();
    }
    let count = 0;
    const MAX_RETOS = 10;
    for (const course of courses.slice(0, 3)) {
      if (count >= MAX_RETOS) break;
      const modules = await apiService.modules.getByCourse(course.idCourse).catch(() => []);
      if (modules.length === 0) {
        console.warn(`[Dashboard] Sin módulos para curso ${course.idCourse}, usando fallback simulations`);
        return await fetchRetosFromSimulations();
      }
      for (const mod of modules) {
        if (count >= MAX_RETOS) break;
        const lessons = await apiService.lessons.getByModule(mod.idModule).catch(() => []);
        if (lessons.length === 0) continue;
        for (const lesson of lessons) {
          if (count >= MAX_RETOS) break;
          const activities = await apiService.activities.getByLesson(lesson.idLesson).catch(() => []);
          for (const act of activities) {
            if (count >= MAX_RETOS) break;
            retos.push({
              id: act.idActivity,
              nombre: act.name,
              categoria: course.name,
              courseId: course.idCourse,
              dificultad: 2,
              estado: true,
            });
            count++;
          }
        }
      }
    }
    if (retos.length === 0) {
      console.warn("[Dashboard] Retos vacíos desde módulos, intentando fallback simulations");
      return await fetchRetosFromSimulations();
    }
  } catch (err) {
    console.warn("[Dashboard] Error en fetchRetosFromActivities, usando fallback simulations:", err);
    return await fetchRetosFromSimulations();
  }
  return retos;
};

const fetchRetosFromSimulations = async () => {
  const retos: { id: string; nombre: string; categoria: string; courseId: string; dificultad: number; estado: boolean }[] = [];
  try {
    const authUser = getAuthState().user;
    const userId = authUser?.id || "config-store";
    const sims = await apiService.simulations.getByUser(userId);
    const courses = await apiService.courses.getAll().catch(() => []);
    const courseMap = new Map(courses.map((c) => [c.idCourse, c.name]));
    let count = 0;
    const MAX_RETOS = 10;
    for (const s of sims) {
      if (count >= MAX_RETOS) break;
      try {
        const data = JSON.parse(s.result);
        if (data.type === "challenge" && !data.deleted) {
          retos.push({
            id: data.idActivity || s.id_simulation,
            nombre: data.title || "Reto sin título",
            categoria: courseMap.get(data.courseId) || `Curso ${data.courseId || "?"}`,
            courseId: data.courseId || "",
            dificultad: data.difficulty === "HARD" ? 3 : data.difficulty === "MEDIUM" ? 2 : 1,
            estado: true,
          });
          count++;
        }
      } catch {}
    }
    console.warn(`[Dashboard] Fallback simulations: ${retos.length} retos encontrados`);
  } catch (err) {
    console.warn("[Dashboard] Error en fetchRetosFromSimulations:", err);
  }
  return retos;
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
      retos: await fetchRetosFromActivities(),
    };
  } catch {
    return {
      metricas: [
        { id: "1", titulo: "Grupos Activos", valor: 0, variacion: "", icono: "school" },
        { id: "2", titulo: "Estudiantes", valor: 0, variacion: "", icono: "group" },
        { id: "3", titulo: "Cursos", valor: 0, variacion: "", icono: "trending_up" },
      ],
      retos: [],
    };
  }
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
  const [dashboardMetrics, setDashboardMetrics] = useState<{
    metricas: { id: string; titulo: string; valor: string | number; variacion: string; icono: string }[];
    retos: { id: string; nombre: string; categoria: string; courseId: string; dificultad: number; estado: boolean }[];
    estudiantesDestacados: { id: string; nombre: string; xp: number; variacionXP: number; posicion: number; avatar: string }[];
  }>({ metricas: [], retos: [], estudiantesDestacados: [] });
  const [metricsReady, setMetricsReady] = useState(false);

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [students, setStudents] = useState<RiaStudentData[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);

  const [rankingModalOpen, setRankingModalOpen] = useState(false);
  const [modalRankingData, setModalRankingData] = useState<{ position: number; studentId: string; studentName: string; totalScore: number }[]>([]);
  const [modalIsLoading, setModalIsLoading] = useState(false);
  const [modalActiveTab, setModalActiveTab] = useState<"global" | "course">("global");
  const [modalCourses, setModalCourses] = useState<{ id: string; name: string }[]>([]);
  const [modalSelectedCourse, setModalSelectedCourse] = useState("");
  const navigate = useNavigate();
  const [deleteConfirmReto, setDeleteConfirmReto] = useState<{ id: string; nombre: string } | null>(null);

  useEffect(() => {
    if (!rankingModalOpen) return;
    setModalIsLoading(true);
    setModalRankingData([]);
    const doFetch = async () => {
      try {
        const courseData = await apiService.courses.getAll();
        if (courseData && courseData.length > 0) {
          setModalCourses(courseData.map((c) => ({ id: c.idCourse, name: c.name })));
          if (!modalSelectedCourse) setModalSelectedCourse(courseData[0].idCourse);
        } else {
          setModalCourses([{ id: "1", name: "Curso principal" }]);
        }
      } catch {
        setModalCourses([{ id: "1", name: "Curso principal" }]);
      }
      try {
        const groups = await apiService.groups.getAll();
        if (groups && groups.length > 0) {
          const data = await apiService.ranking.getGroupRanking(groups[0].idGroup);
          if (data && data.length > 0) {
            setModalRankingData(data.map((dto: RankingDTO) => ({
              position: dto.position,
              studentId: dto.idStudent,
              studentName: `Estudiante #${dto.position}`,
              totalScore: dto.totalPoints,
            })));
          }
        }
      } catch {}
      setModalIsLoading(false);
    };
    doFetch();
  }, [rankingModalOpen]);

  useEffect(() => {
    loadDashboardMetrics().then(({ metricas, retos }) => {
      setDashboardMetrics(prev => ({ ...prev, metricas, retos }));
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
          const destacados = ranking.slice(0, 3).map((s: RankingDTO, i: number) => ({
            id: s.idStudent,
            nombre: `Estudiante #${s.position}`,
            xp: s.totalPoints,
            variacionXP: 0,
            posicion: i + 1,
            avatar: `https://ui-avatars.com/api/?name=Estudiante+${s.position}&background=random`,
          }));
          setDashboardMetrics((prev) => ({ ...prev, estudiantesDestacados: destacados }));
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
  };

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
          <BsPlusCircleFill className="text-sm" />
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
                {dashboardMetrics.retos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.4}>
                          <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
                        </svg>
                        <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                          No hay retos disponibles
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  dashboardMetrics.retos.map((r) => (
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
                          <button
                            onClick={() => navigate("/docente/retos", { state: { courseId: r.courseId } })}
                            className="text-text-muted hover:text-primary transition-colors duration-300 rounded-full p-1"
                          >
                            <span className="material-symbols-outlined text-base">
                              edit
                            </span>
                          </button>
                          <button
                            onClick={() => setDeleteConfirmReto({ id: r.id, nombre: r.nombre })}
                            className="text-text-muted hover:text-red-500 transition-colors duration-300 rounded-full p-1"
                          >
                            <span className="material-symbols-outlined text-base">
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
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
          <button
            onClick={() => setRankingModalOpen(true)}
            className="w-full mt-6 py-3 border border-dashed border-border text-text-muted hover:text-primary hover:border-primary transition-all duration-300 text-xs font-mono uppercase tracking-wider rounded-lg"
          >
            Ver ranking completo
          </button>
        </div>
      </div>

      {/* --- SECCIÓN DE ANALÍTICA IA (BENTO GRID) --- */}
      <div className="border-t border-border my-8" />

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
      </div>

      <RiaBentoGrid
        student={students.find((s) => s.id === selectedStudentId) ?? null}
        studentId={selectedStudentId}
      />

      {/* Modal Confirmación Eliminar */}
      <Modal isOpen={deleteConfirmReto !== null} onClose={() => setDeleteConfirmReto(null)} maxWidth="max-w-sm">
        <div className="p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </div>
          <h3 className="text-base font-mono font-bold mb-3" style={{ color: "var(--text)" }}>¿Eliminar reto?</h3>
          <p className="text-sm font-mono mb-6" style={{ color: "var(--text-muted)" }}>
            ¿Estás seguro de eliminar <strong style={{ color: "var(--text)" }}>{deleteConfirmReto?.nombre}</strong>?
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setDeleteConfirmReto(null)}
              className="px-6 py-3 text-xs font-mono font-bold uppercase tracking-wider border border-border/60 text-text-muted hover:text-text transition-all rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (!deleteConfirmReto) return;
                setDashboardMetrics((prev) => ({
                  ...prev,
                  retos: prev.retos.filter((r) => r.id !== deleteConfirmReto.id),
                }));
                setDeleteConfirmReto(null);
              }}
              className="px-6 py-3 text-xs font-mono font-bold uppercase tracking-wider bg-red-500 text-white hover:bg-red-600 transition-all rounded-lg"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Ranking Completo */}
      <Modal isOpen={rankingModalOpen} onClose={() => setRankingModalOpen(false)} maxWidth="max-w-4xl">
        <div className="p-6 md:p-8">
          <h2 className="text-lg font-mono font-bold tracking-tight mb-6" style={{ color: "var(--text)" }}>
            Ranking Completo
          </h2>

          {/* Tabs */}
          <div className="flex gap-6 mb-6 border-b border-border/30 pb-3">
            <button
              onClick={() => setModalActiveTab("global")}
              className={`text-[10px] font-mono font-bold uppercase tracking-widest pb-3 -mb-3 transition-all ${
                modalActiveTab === "global"
                  ? "text-primary border-b-2 border-primary"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Global
            </button>
            <button
              onClick={() => setModalActiveTab("course")}
              className={`text-[10px] font-mono font-bold uppercase tracking-widest pb-3 -mb-3 transition-all ${
                modalActiveTab === "course"
                  ? "text-primary border-b-2 border-primary"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Por Curso
            </button>
          </div>

          {modalActiveTab === "course" && (
            <div className="mb-6">
              <select
                value={modalSelectedCourse}
                onChange={(e) => setModalSelectedCourse(e.target.value)}
                className="bg-bg border border-border/30 px-4 py-2 text-sm focus:border-primary outline-none rounded-lg"
              >
                {modalCourses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {modalIsLoading ? (
            <div className="text-center py-16 text-text-muted text-[10px] font-mono uppercase tracking-widest animate-pulse">
              Cargando ranking...
            </div>
          ) : modalRankingData.length === 0 ? (
            <div className="text-center py-16 text-text-muted text-xs font-mono">
              No hay datos de ranking disponibles.
            </div>
          ) : (
            <div className="border border-border overflow-hidden rounded-xl">
              <div className="p-4 border-b border-border flex justify-between items-center" style={{ backgroundColor: "var(--surface-brighter)" }}>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: "var(--text)" }}>
                  {modalActiveTab === "global" ? "Ranking Global" : `Ranking del Curso`}
                </span>
                <span className="text-[9px] font-mono text-text-muted">{modalRankingData.length} estudiantes</span>
              </div>
              <div className="divide-y divide-border/30">
                {modalRankingData.map((entry) => (
                  <div key={entry.studentId} className="flex items-center p-4 hover:bg-surface-brighter/50 transition-all duration-200">
                    <div
                      className="w-10 font-mono font-bold text-center text-xs"
                      style={{ color: entry.position <= 3 ? "var(--primary)" : "var(--text-muted)" }}
                    >
                      {entry.position}
                    </div>
                    <div
                      className="w-10 h-10 border flex items-center justify-center font-bold text-xs mr-4 rounded-lg"
                      style={{ backgroundColor: "var(--surface-brighter)", borderColor: "var(--border)", color: "var(--text)" }}
                    >
                      {entry.studentName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold" style={{ color: "var(--text)" }}>{entry.studentName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono font-bold" style={{ color: "var(--primary)" }}>
                        {entry.totalScore.toLocaleString()} XP
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </main>
  );
};
