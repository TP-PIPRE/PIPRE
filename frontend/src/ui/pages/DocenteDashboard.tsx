import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {getAuthState} from "../../infrastructure/store/authStore";
import { apiService } from "../../infrastructure/api/apiService";
import { getApiErrorMessage } from "../../infrastructure/api/errors";
import { useAsyncResource } from "../../application/hooks/useAsyncResource";
import { loadTeacherDashboard } from "../../application/usecases/loadTeacherDashboard";
import { CirclePlus as BsPlusCircleFill, GraduationCap as BsMortarboardFill, Users as BsPeopleFill, TrendingUp as BsGraphUpArrow } from "lucide-react";
import { Modal } from "../components/common/Modal";
const EMPTY_RANKING: Awaited<ReturnType<typeof loadTeacherDashboard>>["ranking"]=[];

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
  const resource=useAsyncResource("dashboard",loadTeacherDashboard);
  const [operationError,setOperationError]=useState("");
  const [deleting,setDeleting]=useState(false);
  const [rankingModalOpen,setRankingModalOpen]=useState(false);
  const [modalActiveTab,setModalActiveTab]=useState<"global"|"course">("global");
  const [courseChoice,setModalSelectedCourse]=useState("");
  const [deleteConfirmReto,setDeleteConfirmReto]=useState<{id:string;nombre:string}|null>(null);
  const navigate=useNavigate();
  const ranking=resource.data?.ranking??EMPTY_RANKING;
  const modalCourses=(resource.data?.courses??[]).map(course=>({id:course.idCourse,name:course.name}));
  const modalSelectedCourse=modalCourses.some(course=>course.id===courseChoice)?courseChoice:modalCourses[0]?.id??"";
  const loadModal=async()=>modalActiveTab==="course"
    ?modalSelectedCourse?apiService.ranking.getCourseRanking(modalSelectedCourse):[]
    :ranking;
  const modal=useAsyncResource(rankingModalOpen?JSON.stringify([modalActiveTab,modalSelectedCourse,modalActiveTab==="global"?ranking:null]):undefined,loadModal);
  const modalRankingData=(modal.data??[]).map(row=>({position:row.position,studentId:row.idStudent,studentName:row.studentName||`Estudiante #${row.position}`,totalScore:row.totalPoints}));
  const modalIsLoading=modal.loading;
  const studentsLoading=resource.loading;
  const metricsReady=Boolean(resource.data);
  const dashboardMetrics={
    metricas:[
      {id:"1",titulo:"Grupos Activos",valor:resource.data?.groups.length??"—",variacion:"",icono:"school"},
      {id:"2",titulo:"Estudiantes",valor:resource.data?ranking.length:"—",variacion:"",icono:"group"},
      {id:"3",titulo:"Cursos",valor:resource.data?.courses.length??"—",variacion:"",icono:"trending_up"},
    ],
    retos:resource.data?.challenges??[],
    estudiantesDestacados:ranking.slice(0,3).map(row=>({id:row.idStudent,nombre:row.studentName||`Estudiante #${row.position}`,xp:row.totalPoints,variacionXP:0,posicion:row.position,avatar:""})),
  };

  if (!metricsReady && studentsLoading && !resource.error)
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
      {(resource.error || operationError && !deleteConfirmReto) && <div role="alert" className="mb-4 border border-danger rounded-lg p-4"><p>{operationError || "No pudimos cargar el panel. Comprueba la conexión y reintenta."}</p><button className="btn-secondary mt-2" onClick={()=>{setOperationError("");resource.retry();}}>Reintentar</button></div>}
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1
            className="text-xl font-mono font-bold tracking-tight mb-1 transition-all duration-300 hover:text-primary"
            style={{ color: "var(--text)" }}
          >
            Panel docente
          </h1>
          <p
            className="text-sm transition-all duration-300"
            style={{ color: "var(--text-muted)" }}
          >
            Gestión de retos, estudiantes y seguimiento de progreso
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3"><Link to="/docente/metricas" className="btn-secondary">Ver métricas educativas</Link><button onClick={() => navigate("/docente/retos")} className="bg-primary text-bg px-6 py-3 font-mono font-bold uppercase tracking-wider text-xs hover:opacity-90 transition-all duration-300  flex items-center gap-2 shrink-0 rounded-lg">
          <BsPlusCircleFill className="text-sm" />
          Nuevo Reto
        </button></div>
      </div>

      {/* Métricas originales (Retos Activos, Estudiantes, Progreso Global) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {dashboardMetrics.metricas.map((m) => (
          <div
            key={m.id}
            className="border border-border bg-surface p-6 transition-all duration-300 hover:shadow-lg  rounded-lg"
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
                style={{ borderColor: "var(--border)" }}
              >
                {!metricsReady && <tr><td colSpan={5} role="status">Cargando retos…</td></tr>}
                {metricsReady && dashboardMetrics.retos.length === 0 && <tr><td colSpan={5}>No hay retos disponibles.</td></tr>}
                {dashboardMetrics.retos.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-surface transition-colors duration-300 rounded-lg"
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
                            ? "bg-green-500/10 text-success"
                            : "bg-yellow-500/10 text-accent"
                        }`}
                      >
                        {r.estado ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          aria-label={`Editar ${r.nombre}`} onClick={() => navigate("/docente/retos", { state: { courseId: r.courseId } })}
                          className="text-text-muted hover:text-primary transition-colors duration-300 rounded-full p-1"
                        >
                          <Pencil size={18} aria-hidden="true" />
                        </button>
                        <button
                          aria-label={`Eliminar ${r.nombre}`} onClick={() => {setOperationError("");setDeleteConfirmReto({ id: r.id, nombre: r.nombre });}}
                          className="text-text-muted hover:text-danger transition-colors duration-300 rounded-full p-1"
                        >
                          <Trash2 size={18} aria-hidden="true" />
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
                className="flex items-center gap-4 p-3 border border-border transition-all duration-300 hover:shadow-sm rounded-lg"
              >
                <div className="relative shrink-0">
                  <img
                    alt={e.nombre}
                    className="w-10 h-10 object-cover border border-border rounded-md"
                    src={e.avatar}
                  />
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center font-bold text-xs rounded-full text-bg"
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
                      className="text-xs font-mono transition-colors duration-300"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {e.xp} puntos
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
          {operationError && <p role="alert" className="mb-3 text-danger">{operationError}</p>}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setDeleteConfirmReto(null)}
              className="px-6 py-3 text-xs font-mono font-bold uppercase tracking-wider border border-border text-text-muted hover:text-text transition-all rounded-lg"
            >
              Cancelar
            </button>
            <button
              disabled={deleting}
              onClick={async () => {
                if (!deleteConfirmReto || deleting) return;
                setDeleting(true);
                try {
                  await apiService.activities.delete(deleteConfirmReto.id);
                  setDeleteConfirmReto(null);resource.retry();
                } catch(error) {setOperationError(getApiErrorMessage(error,"No se pudo eliminar el reto."));}
                finally {setDeleting(false);}
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
          <div className="flex gap-6 mb-6 border-b border-border pb-3">
            <button
              onClick={() => setModalActiveTab("global")}
              className={`text-xs font-mono font-bold uppercase tracking-widest pb-3 -mb-3 transition-all ${
                modalActiveTab === "global"
                  ? "text-primary border-b-2 border-primary"
                  : "text-text-muted hover:text-text"
              }`}
            >
              {getAuthState().user?.role==="admin"?"Global":"Mis aulas"}
            </button>
            <button
              onClick={() => setModalActiveTab("course")}
              className={`text-xs font-mono font-bold uppercase tracking-widest pb-3 -mb-3 transition-all ${
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
                className="bg-bg border border-border px-4 py-2 text-sm focus:border-primary outline-none rounded-lg"
              >
                {modalCourses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {modal.error ? <div role="alert"><p>No pudimos cargar el ranking.</p><button className="btn-secondary" onClick={modal.retry}>Reintentar</button></div> : modalIsLoading ? (
            <div className="text-center py-16 text-text-muted text-xs font-mono uppercase tracking-widest animate-pulse">
              Cargando ranking...
            </div>
          ) : modalRankingData.length === 0 ? (
            <div className="text-center py-16 text-text-muted text-xs font-mono">
              No hay datos de ranking disponibles.
            </div>
          ) : (
            <div className="border border-border overflow-hidden rounded-xl">
              <div className="p-4 border-b border-border flex justify-between items-center" style={{ backgroundColor: "var(--surface-brighter)" }}>
                <span className="text-xs font-mono font-bold uppercase tracking-widest" style={{ color: "var(--text)" }}>
                  {modalActiveTab === "global" ? "Ranking Global" : `Ranking del Curso`}
                </span>
                <span className="text-xs font-mono text-text-muted">{modalRankingData.length} estudiantes</span>
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
                        {entry.totalScore.toLocaleString()} puntos
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
