import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight as BsChevronRight } from "lucide-react";
import { apiService } from "../../infrastructure/api/apiService";
import type { Course } from "../../shared/types/Course";
import { Modal } from "../components/common/Modal";
import { CircuitBoard, Shapes, ArrowRight, BookOpen, AlertCircle } from "lucide-react";
import { loadCourseActivities } from "../../application/usecases/loadCourseActivities";
import { resolveActivityLevel } from "../../application/usecases/activityLevels";
import { getApiErrorMessage } from "../../infrastructure/api/errors";

interface ChallengeView {
  id: string;
  idActivity: string;
  title: string;
  order: number;
  difficulty: string;
  description: string;
  playable: boolean;
  countChallenge: boolean;
}

const CHALLENGES_PER_PAGE = 10;

export const PaginaInicio = () => {
  const navigate = useNavigate();
  const [cursos, setCursos] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedCourseChallenges, setSelectedCourseChallenges] = useState<ChallengeView[]>([]);
  const [selectedCourseName, setSelectedCourseName] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [challengePage, setChallengePage] = useState(0);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const [challengeError, setChallengeError] = useState("");
  const challengeRequest = useRef(0);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await apiService.courses.getAll();
        const mapped: Course[] = data.map((c) => ({
          id: c.idCourse,
          nombre: c.name,
          descripcion: c.description || (c.idCourse === "c001" ? "Guía la luz con espejos y filtros. Explora la lógica paso a paso." : c.idCourse === "c002" ? "Combina piezas, reconoce patrones y entrena tu razonamiento espacial." : "Explora los retos y actividades de este curso."),
          imagen: "",
          tipo: "curso",
          challenges: [],
        }));
        setCursos(mapped);
      } catch {
        setLoadError(true);
        setCursos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const fetchChallengesFromActivities = async (courseId: string): Promise<ChallengeView[]> => {
      const activities = await loadCourseActivities(courseId);
      return activities.map((act, i) => {
        const template = resolveActivityLevel(act);
        const countChallenge = template?.game === "tetrilogic";
        return {
        id: act.idActivity,
        idActivity: act.idActivity,
        title: act.name,
        order: (act.displayOrder ?? i + 1) - 1,
        difficulty: act.difficulty || "MEDIUM",
        description: countChallenge ? `${template.config.boardSize.cols} × ${template.config.boardSize.rows} · Iguala los objetivos de filas y columnas.` : act.description ?? "",
        playable: Boolean(template),
        countChallenge,
      }; });
  };

  const openCourseChallenges = async (course: Course) => {
    const requestId = ++challengeRequest.current;
    setChallengeError(""); setSelectedCourseChallenges([]);
    setChallengePage(0);
    setSelectedCourseName(course.nombre);
    setSelectedCourseId(course.id);
    setLoadingChallenges(true);
    setIsChallengeModalOpen(true);
    try {
      const challenges = await fetchChallengesFromActivities(course.id);
      if (requestId === challengeRequest.current) setSelectedCourseChallenges(challenges);
    } catch (e) { if (requestId === challengeRequest.current) setChallengeError(getApiErrorMessage(e, "No se pudieron cargar los retos.")); }
    finally { if (requestId === challengeRequest.current) setLoadingChallenges(false); }
  };

  const paginatedChallenges = [...selectedCourseChallenges]
    .sort((a, b) => a.order - b.order)
    .slice(challengePage * CHALLENGES_PER_PAGE, (challengePage + 1) * CHALLENGES_PER_PAGE);

  const totalPages = Math.ceil(selectedCourseChallenges.length / CHALLENGES_PER_PAGE);
  const allCounts = selectedCourseChallenges.length > 0 && selectedCourseChallenges.every(challenge => challenge.countChallenge);
  const availableLabel = selectedCourseChallenges.length === 1
    ? `1 ${allCounts ? "reto" : "actividad"} disponible`
    : `${selectedCourseChallenges.length} ${allCounts ? "retos" : "actividades"} disponibles`;

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full">
      <header className="mb-8 md:mb-10">
        <p className="page-eyebrow mb-3">Explora tu laboratorio</p>
        <h1 className="font-bold mb-3">Un reto, una nueva forma de pensar.</h1>
        <p className="page-intro">Experimenta con luz, formas y patrones. Elige un curso para practicar a tu ritmo y poner a prueba tus ideas.</p>
      </header>
      <div className="flex items-center justify-between gap-3 border-b border-border pb-4 mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2"><BookOpen size={20} aria-hidden="true" />Mis cursos</h2>
        {!loading && <span className="text-sm text-text-muted">{cursos.length} disponibles</span>}
      </div>
      {loading ? <div role="status" className="py-16 text-center text-text-muted">Cargando cursos…</div> : loadError ? <div role="alert" className="p-6 border border-danger rounded-xl"><AlertCircle className="mb-3 text-danger" aria-hidden="true" /><h2 className="text-lg mb-2">No pudimos cargar los cursos</h2><p className="text-text-muted mb-4">Comprueba tu conexión y vuelve a intentarlo.</p><button onClick={() => window.location.reload()} className="btn-secondary">Reintentar</button></div> : cursos.length === 0 ? <p className="py-16 text-center text-text-muted">Todavía no hay cursos disponibles.</p> : <section aria-label="Cursos disponibles" className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cursos.map((item, i) => {
          const Icon = item.id === "c002" ? Shapes : CircuitBoard;
          return <button key={item.id} onClick={() => openCourseChallenges(item)} className="course-card group">
            <div className="course-preview"><div className="course-glyph"><Icon size={44} strokeWidth={1.5} aria-hidden="true" /></div><span className="course-index" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span></div>
            <div className="p-5 md:p-7 flex-1 flex flex-col gap-3"><span className="page-eyebrow">{item.id === "c002" ? "Razonamiento espacial" : item.id === "c001" ? "Lógica proposicional" : "Aprendizaje interactivo"}</span><h3 className="text-xl font-bold">{item.nombre}</h3><p className="text-sm text-text-muted leading-relaxed flex-1">{item.descripcion}</p><div className="mt-4 pt-4 border-t border-border flex justify-between items-center gap-3"><span className="text-xs font-semibold text-success">Disponible</span><span className="text-sm font-semibold text-primary flex items-center gap-2">Ver retos <ArrowRight size={18} aria-hidden="true" /></span></div></div>
          </button>;
        })}
      </section>}
      <Modal isOpen={isChallengeModalOpen} onClose={() => setIsChallengeModalOpen(false)} maxWidth="max-w-2xl" height="min(80vh, 640px)" title={`${allCounts ? "Retos" : "Actividades"} de ${selectedCourseName}`}>
        <div className="flex flex-col h-full">
          <header className="p-6 pr-16 border-b border-border"><p className="page-eyebrow mb-2">{allCounts ? "Elige un reto de filas y columnas" : "Elige tu próxima actividad"}</p><h2 className="text-xl font-bold">{selectedCourseName}</h2><p className="text-sm text-text-muted mt-2">{loadingChallenges ? "Buscando actividades…" : availableLabel}</p></header>
          <div className="flex-1 overflow-y-auto p-4 space-y-3" aria-busy={loadingChallenges}>
            {loadingChallenges ? <p role="status" className="py-12 text-center text-text-muted">Cargando actividades…</p> : challengeError ? <p role="alert" className="p-4 text-danger">{challengeError}</p> : paginatedChallenges.length ? paginatedChallenges.map(challenge => <div key={challenge.id} className="flex flex-wrap items-center justify-between gap-3 p-4 border border-border rounded-lg"><div className="flex-1 min-w-0"><p className="font-semibold break-words">{challenge.title}</p><p className="text-sm text-text-muted mt-1">{challenge.countChallenge ? `Reto ${challenge.order + 1} · Filas y columnas` : `Reto ${challenge.order + 1} · ${challenge.difficulty}`}</p>{challenge.description && <p className="mt-2 text-sm text-text-muted">{challenge.description}</p>}</div><button disabled={!challenge.playable} onClick={() => navigate(`/simulador/${selectedCourseId}?activity=${encodeURIComponent(challenge.idActivity)}`)} className="btn-secondary px-4">{challenge.playable ? "Iniciar" : "Tablero pendiente"} <BsChevronRight aria-hidden="true" /></button></div>) : <p className="py-12 text-center text-text-muted">No hay actividades disponibles para este curso.</p>}
          </div>
          {totalPages > 1 && <footer className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-border"><span className="text-sm text-text-muted">Página {challengePage + 1} de {totalPages}</span><div className="flex gap-2"><button disabled={challengePage === 0} onClick={() => setChallengePage(p => p - 1)} className="btn-secondary px-3">Anterior</button><button disabled={challengePage >= totalPages - 1} onClick={() => setChallengePage(p => p + 1)} className="btn-secondary px-3">Siguiente</button></div></footer>}
        </div>
      </Modal>
    </main>
  );
};
