import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import { PersistedNeonFlowStage } from "../components/NeonFlow/PersistedNeonFlowStage";
import { NeonFlowStage } from "../components/NeonFlow/NeonFlowStage";
import { TetriLogicStage } from "../components/TetriLogic/TetriLogicStage";
import { PersistedTetriLogicStage } from "../components/TetriLogic/PersistedTetriLogicStage";
import { CourseProgressFeedback } from "../components/common/CourseProgressFeedback";
import { NeonFlowPreview, TetriLogicPreview } from "../components/common/ChallengeBoardPreview";
import { DailyChallengeStage } from "../components/common/DailyChallengeStage";
import { useCourseProgress } from "../components/common/useCourseProgress";
import { loadCourseActivities } from "../../application/usecases/loadCourseActivities";
import { activityDescription, activityDisplayName, challengeAccess, resolveActivityLevel } from "../../application/usecases/activityLevels";
import { getApiErrorMessage } from "../../infrastructure/api/errors";
import type { ActivityResponseDTO } from "../../infrastructure/api/models/apiModels";
import { isOfficialGameTemplate } from "../../infrastructure/api/models/gameProgressModels";
import { getAuthState } from "../../infrastructure/store/authStore";
import { isOfficialCourse } from "../../shared/constants/officialCourses";
import { PROGRESSIVE_NEONFLOW_LEVELS } from "../../shared/constants/levelConfigs";

const NEONFLOW_IDS = new Set(["1", "neonflow", "logica"]);
const TETRILOGIC_IDS = new Set(["2", "tetrilogic", "patrones"]);
const noticeClass = "mx-auto max-w-2xl rounded-xl border border-border bg-surface p-8 text-center space-y-4";

export const Simulador = () => {
  const { courseId = "" } = useParams<{ courseId?: string }>();
  const [search] = useSearchParams();
  const normalized = courseId.trim().toLowerCase();

  if (search.get("daily") === "true") return <DailyChallengeStage />;
  if (!search.has("activity")) {
    if (NEONFLOW_IDS.has(normalized)) return <NeonFlowStage levels={PROGRESSIVE_NEONFLOW_LEVELS} />;
    if (!courseId || TETRILOGIC_IDS.has(normalized)) return <TetriLogicStage />;
  }
  if (!isOfficialCourse(courseId)) return <section className={noticeClass}>
    <h1 className="text-xl font-bold">Este curso ya no está disponible</h1>
    <Link to="/" className="btn-secondary">Ver mis cursos</Link>
  </section>;

  const user = getAuthState().user;
  return <CourseSimulator key={`${courseId}:${user?.id}:${user?.role}`} courseId={courseId}
    studentId={user?.role === "student" ? user.id : undefined}
    canManage={user?.role === "docente" || user?.role === "admin"} />;
};

function CourseSimulator({ courseId, studentId, canManage }: { courseId: string; studentId?: string; canManage: boolean }) {
  const [search, setSearch] = useSearchParams();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ attempt: number; activities: ActivityResponseDTO[]; error?: string }>();
  const progress = useCourseProgress(studentId);

  useEffect(() => {
    let active = true;
    loadCourseActivities(courseId).then(activities => {
      if (active) setResult({ attempt, activities });
    }).catch(error => {
      if (active) setResult({ attempt, activities: [], error: getApiErrorMessage(error, "No se pudo cargar el curso.") });
    });
    return () => { active = false; };
  }, [courseId, attempt]);

  if (result?.attempt !== attempt) return <p role="status" className="p-8 text-center">Cargando retos del curso…</p>;
  if (result.error) return <section className={noticeClass}>
    <h1 className="text-xl font-bold">No pudimos cargar los retos</h1>
    <p role="alert">{result.error}</p>
    <button className="btn-secondary" onClick={() => setAttempt(value => value + 1)}>Reintentar</button>
    <Link to="/" className="btn-secondary">Ver mis cursos</Link>
  </section>;

  const activityId = search.get("activity");
  const challenges = result.activities.map(activity => {
    const template = resolveActivityLevel(activity);
    const access = canManage && template ? "available" : challengeAccess(template, progress.levels, progress.pending || Boolean(progress.error));
    return { activity, template, access };
  });
  const selected = activityId
    ? challenges.find(({ activity }) => activity.idActivity === activityId)
    : challenges.find(({ template }) => template?.config.level === 1)
      ?? challenges.find(({ template }) => template) ?? challenges[0];
  const activity = selected?.activity;
  const template = selected?.template;
  const locked = selected?.access === "locked";
  const unconfirmed = selected?.access === "unconfirmed";
  const preview = locked || unconfirmed;
  const available = selected?.access === "available";
  const next = available && studentId && template && isOfficialGameTemplate(template.game, template.id)
    ? challenges.filter(candidate => candidate.template && candidate.template.game === template.game
        && candidate.template.config.level > template.config.level
        && isOfficialGameTemplate(candidate.template.game, candidate.template.id) && candidate.access === "available")
      .sort((a, b) => a.template!.config.level - b.template!.config.level)[0]
    : undefined;
  const goToNext = next ? () => setSearch({ activity: next.activity.idActivity }) : undefined;
  const manage = canManage && (!activityId || activity)
    ? <Link to="/docente/retos" state={{ courseId }} className="btn-secondary">{challenges.length ? "Configurar tablero" : "Crear un reto"}</Link>
    : null;
  const board = activity && template && (available || preview) && (
    template.game === "neonflow"
      ? template.config.version === 2 || template.config.version === 3
        ? <PersistedNeonFlowStage key={`${activity.idActivity}:${template.id}`} activity={activity} config={template.config} onNext={goToNext} preview={preview} />
        : preview ? <NeonFlowPreview config={template.config} />
          : <NeonFlowStage key={activity.idActivity} activity={activity} levels={[template.config]} />
      : template.config.version === 2
        ? <PersistedTetriLogicStage key={`${activity.idActivity}:${template.id}`} activity={activity} config={template.config} onNext={goToNext} preview={preview} />
        : preview ? <TetriLogicPreview config={template.config} />
          : <TetriLogicStage key={activity.idActivity} activity={activity} levels={[template.config]} />
  );

  return <div>
    <CourseProgressFeedback {...progress} />
    {challenges.length > 0 && <div className="simulator-course-picker">
      <label htmlFor="simulator-activity">{template?.game === "tetrilogic" ? "Tablero del curso" : "Reto del curso"}</label>
      <select id="simulator-activity" value={activity?.idActivity ?? ""} onChange={event => setSearch({ activity: event.target.value })}>
        {!activity && <option value="" disabled>Selecciona un reto</option>}
        {challenges.map(item => <option key={item.activity.idActivity} value={item.activity.idActivity}>
          {activityDisplayName(item.activity)}{item.access === "pending" ? " · tablero pendiente" : item.access === "locked" ? " · bloqueado" : item.access === "unconfirmed" ? " · progreso por confirmar" : ""}
        </option>)}
      </select>
    </div>}
    {board ? <div className={preview ? "lab-shell" : undefined}>
      {preview && activity && <header className="lab-heading">
        <div>
          <Link to="/" className="text-sm font-semibold text-primary">← Mis cursos</Link>
          <p className="page-eyebrow">Vista previa · Solo lectura</p>
          <h1 className="flex items-center gap-2">
            <LockKeyhole size={20} className="shrink-0" aria-hidden="true" />
            {locked ? "Nivel bloqueado" : "Progreso por confirmar"}
          </h1>
          <h2 className="font-semibold">{activityDisplayName(activity)}</h2>
          <p className="text-text-muted">{activityDescription(activity, template)}</p>
          <p className="page-intro">{locked
            ? "Completa el nivel anterior para desbloquear este tablero."
            : "Podrás jugar cuando se confirme que este reto está desbloqueado."}</p>
        </div>
      </header>}
      {board}
    </div> : <section className={noticeClass}>
      <h1 className="text-xl font-bold">{activity
        ? "Este reto aún no está listo para jugar"
        : activityId ? "No encontramos este reto" : "Este curso aún no tiene retos"}</h1>
      <p role="status" className="text-text-muted">{activity
        ? canManage ? "Edita la actividad y selecciona Tablero del reto." : "El tablero aún está pendiente de configuración por parte de tu docente."
        : activityId ? "El reto ya no está disponible o no pertenece a este curso." : canManage ? "Añade un reto y asígnale un tablero." : "Tu docente todavía no ha añadido retos a este curso."}</p>
      {activity && <p>{activityDisplayName(activity)}{activity.description && ` · ${activity.description}`}</p>}
      <div className="flex flex-wrap justify-center gap-3">
        {manage}
        <Link to="/" className="btn-secondary">Ver mis cursos</Link>
      </div>
    </section>}
  </div>;
}
