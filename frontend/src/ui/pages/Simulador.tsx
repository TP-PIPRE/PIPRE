import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { NeonFlowStage } from "../components/NeonFlow/NeonFlowStage";
import { TetriLogicStage } from "../components/TetriLogic/TetriLogicStage";

import { loadCourseActivities } from "../../application/usecases/loadCourseActivities";
import { resolveActivityLevel } from "../../application/usecases/activityLevels";
import { getApiErrorMessage } from "../../infrastructure/api/errors";
import type { ActivityResponseDTO } from "../../infrastructure/api/models/apiModels";
import { getAuthState } from "../../infrastructure/store/authStore";

const NEONFLOW_IDS = new Set(["1", "neonflow", "logica"]);
const TETRILOGIC_IDS = new Set(["2", "tetrilogic", "patrones"]);

export const Simulador = () => {
  const { courseId = "" } = useParams<{ courseId?: string }>();
  const [search, setSearch] = useSearchParams();
  const [retry, setRetry] = useState(0);
  const [data, setData] = useState<{ courseId: string; activities: ActivityResponseDTO[]; error: string } | null>(null);
  const normalized = courseId.trim().toLowerCase();
  const legacy = NEONFLOW_IDS.has(normalized) || TETRILOGIC_IDS.has(normalized);
  useEffect(() => {
    if (legacy || !courseId) return;
    let active = true;
    loadCourseActivities(courseId).then(activities => {
      if (active) setData({ courseId, activities, error: "" });
    }).catch(e => { if (active) setData({ courseId, activities: [], error: getApiErrorMessage(e, "No se pudo cargar el curso.") }); });
    return () => { active = false; };
  }, [courseId, legacy, retry]);

  if (NEONFLOW_IDS.has(normalized)) return <NeonFlowStage />;
  if (TETRILOGIC_IDS.has(normalized)) return <TetriLogicStage />;

  if (courseId && data?.courseId !== courseId) return <p role="status" className="p-8 text-center">Cargando retos del curso…</p>;
  const courseData = courseId && data?.courseId === courseId ? data : null;
  const activityId = search.get("activity");
  const activity = activityId ? courseData?.activities.find(a => a.idActivity === activityId) : courseData?.activities.find(a => resolveActivityLevel(a));
  const template = activity && resolveActivityLevel(activity);
  const role = getAuthState().user?.role;
  const canManage = role === "docente" || role === "admin";
  const showConfigure = canManage && Boolean(courseId) && !courseData?.error && (!activityId || Boolean(activity));
  const notice = !courseId
    ? { title: "Selecciona un reto para empezar", message: "En Mis cursos, elige un curso y pulsa Iniciar en el reto que quieras resolver." }
    : courseData?.error
      ? { title: "No pudimos cargar los retos", message: courseData.error }
      : activityId && !activity
        ? { title: "No encontramos este reto", message: "El reto ya no está disponible o no pertenece a este curso. Vuelve a tus cursos y selecciona otro." }
        : !courseData?.activities.length
          ? { title: "Este curso aún no tiene retos", message: canManage ? "Añade un reto y asígnale un tablero desde la gestión del curso para habilitar la práctica." : "Tu docente todavía no ha añadido retos a este curso. Mientras tanto, puedes explorar otros cursos." }
          : { title: activity ? "Este reto aún no está listo para jugar" : "Este curso aún no tiene retos listos para jugar", message: canManage ? "Abre el curso en Retos, edita la actividad y selecciona Tablero del reto. Guarda los cambios para habilitarla." : "El tablero aún está pendiente de configuración por parte de tu docente. Mientras lo prepara, puedes elegir otro reto desde Mis cursos." };
  return <div>
    {courseData?.activities.length ? <div className="mx-auto mb-5 max-w-5xl rounded-lg border border-border bg-surface p-4">
      <label htmlFor="simulator-activity" className="mb-2 block text-sm font-semibold">Reto del curso</label>
      <select id="simulator-activity" className="w-full rounded-lg border border-border bg-bg p-3" value={activity?.idActivity ?? ""} onChange={e => setSearch({ activity: e.target.value })}>
        {!activity && <option value="" disabled>Selecciona un reto</option>}
        {courseData.activities.map(a => <option key={a.idActivity} value={a.idActivity}>{a.name}{resolveActivityLevel(a) ? "" : " · tablero pendiente"}</option>)}
      </select>
    </div> : null}
    {activity && template ? template.game === "neonflow"
      ? <NeonFlowStage key={activity.idActivity} activity={activity} levels={[template.config]} />
      : <TetriLogicStage key={activity.idActivity} activity={activity} levels={[template.config]} />
      : <div className="mx-auto max-w-2xl rounded-xl border border-border bg-surface p-8 text-center space-y-4">
        <h1 className="text-xl font-bold">{notice.title}</h1>
        <p role={courseData?.error ? "alert" : "status"} className="text-text-muted">{notice.message}</p>
        <div className="flex flex-wrap justify-center gap-3">
          {courseData?.error && <button className="btn-secondary" onClick={() => setRetry(r => r + 1)}>Reintentar</button>}
          {showConfigure && <Link to="/docente/retos" state={{ courseId }} className="btn-premium">{courseData?.activities.length ? "Configurar tablero" : "Crear un reto"}</Link>}
          <Link to="/" className="btn-secondary">Ver mis cursos</Link>
        </div>
      </div>}
  </div>;
};
