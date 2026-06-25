import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BsChevronRight,
} from "react-icons/bs";
import { apiService } from "../../infrastructure/api/apiService";
import type { Course } from "../../shared/types/Course";
import { Modal } from "../components/common/Modal";
import { RobotIcon } from "../components/common/RobotIcon";

interface ChallengeView {
  id: string;
  idActivity: string;
  title: string;
  order: number;
  difficulty: string;
  points: number;
}

const CHALLENGES_PER_PAGE = 10;

export const PaginaInicio = () => {
  const navigate = useNavigate();
  const [cursos, setCursos] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseChallenges, setSelectedCourseChallenges] = useState<ChallengeView[]>([]);
  const [selectedCourseName, setSelectedCourseName] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [challengePage, setChallengePage] = useState(0);
  const [loadingChallenges, setLoadingChallenges] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await apiService.courses.getAll();
        const mapped: Course[] = data.map((c) => ({
          id: c.idCourse,
          nombre: c.name,
          descripcion: "Explora los fundamentos de este módulo industrial.",
          imagen: "",
          tipo: "curso",
          challenges: [],
        }));
        setCursos(mapped);
      } catch {
        setCursos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const fetchChallengesFromActivities = async (courseId: string): Promise<ChallengeView[]> => {
    try {
      const modules = await apiService.modules.getByCourse(courseId);
      if (modules.length === 0) return [];
      const lessons = (await Promise.all(
        modules.map((mod) => apiService.lessons.getByModule(mod.idModule)),
      )).flat();
      if (lessons.length === 0) return [];
      const activities = (await Promise.all(
        lessons.map((lesson) => apiService.activities.getByLesson(lesson.idLesson)),
      )).flat();
      return activities.map((act, i) => ({
        id: act.idActivity,
        idActivity: act.idActivity,
        title: act.name,
        order: i,
        difficulty: "MEDIUM",
        points: 0,
      }));
    } catch {
      return [];
    }
  };

  const openCourseChallenges = async (course: Course) => {
    setChallengePage(0);
    setSelectedCourseName(course.nombre);
    setSelectedCourseId(course.id);
    setLoadingChallenges(true);
    setIsChallengeModalOpen(true);
    const challenges = await fetchChallengesFromActivities(course.id);
    setSelectedCourseChallenges(challenges);
    setLoadingChallenges(false);
  };

  const paginatedChallenges = selectedCourseChallenges
    .sort((a, b) => a.order - b.order)
    .slice(challengePage * CHALLENGES_PER_PAGE, (challengePage + 1) * CHALLENGES_PER_PAGE);

  const totalPages = Math.ceil(selectedCourseChallenges.length / CHALLENGES_PER_PAGE);

  return (
    <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-8 pt-[6rem] pb-24 animate-fade-in-soft">
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Ecosistema de <span className="text-primary/70">Aprendizaje</span>
        </h1>
        <p className="text-text-muted/60 text-xs font-medium max-w-lg leading-relaxed">
          Plataforma educativa modular para la formación técnica en robótica
          industrial y automatización.
        </p>
      </div>

      {/* Challenge Modal */}
      <Modal
        isOpen={isChallengeModalOpen}
        onClose={() => setIsChallengeModalOpen(false)}
        maxWidth="max-w-2xl"
        height="min(80vh, 600px)"
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border/10">
            <div className="flex items-center gap-3 mb-1">
              <RobotIcon size={18} />
              <h2 className="text-lg font-bold">{selectedCourseName}</h2>
            </div>
            <p className="text-xs text-text-muted/60">
              {selectedCourseChallenges.length} retos disponibles
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loadingChallenges ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : paginatedChallenges.length > 0 ? (
              paginatedChallenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="flex items-center justify-between p-4 bg-surface-brighter/50 border border-border/20 rounded-lg hover:border-primary/30 transition-all group"
                  style={{ borderRadius: "var(--theme-radius)" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text truncate">
                      {challenge.title}
                    </p>
                    <div className="flex gap-4 mt-1">
                      <span className="text-[10px] font-medium text-text-muted/60">
                        Orden {challenge.order + 1}
                      </span>
                      <span className="text-[10px] font-medium text-text-muted/60">
                        {challenge.difficulty}
                      </span>
                      <span className="text-[10px] font-medium text-text-muted/60">
                        {challenge.points} pts
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/simulador/${selectedCourseId}`)}
                    className="shrink-0 ml-3 px-4 py-2 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all"
                    style={{ borderRadius: "var(--theme-radius)" }}
                  >
                    Iniciar
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <p className="text-xs text-text-muted/40 font-medium">
                  No hay retos disponibles para este curso.
                </p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/10">
              <span className="text-[10px] text-text-muted/60">
                {challengePage * CHALLENGES_PER_PAGE + 1}–{Math.min((challengePage + 1) * CHALLENGES_PER_PAGE, selectedCourseChallenges.length)} de {selectedCourseChallenges.length}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={challengePage === 0}
                  onClick={() => setChallengePage(p => p - 1)}
                  className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-border/20 rounded-md disabled:opacity-30 hover:border-primary transition-all"
                >
                  ← Anterior
                </button>
                <button
                  disabled={challengePage >= totalPages - 1}
                  onClick={() => setChallengePage(p => p + 1)}
                  className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-border/20 rounded-md disabled:opacity-30 hover:border-primary transition-all"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Grid of courses */}
      {loading ? (
        <div className="py-32 flex flex-col items-center gap-6 opacity-30">
          <div className="w-10 h-10 border border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] font-bold">
            Sincronizando Nodo...
          </span>
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {cursos.map((item) => (
            <article
              key={item.id}
              onClick={() => openCourseChallenges(item)}
              className="group bg-surface/30 border border-border/10 flex flex-col cursor-pointer transition-all duration-700 hover:border-primary/20 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden"
              style={{ borderRadius: "var(--theme-radius)" }}
            >
              <div className="aspect-video w-full overflow-hidden relative bg-bg/40">
                {item.imagen ? (
                  <img
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000"
                    src={item.imagen}
                    alt={item.nombre}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary/10 group-hover:text-primary/30 transition-colors duration-500">
                    <RobotIcon size={48} className="group-hover:scale-110 transition-transform opacity-20 group-hover:opacity-40" />
                  </div>
                )}
                <span
                  className="absolute top-5 left-5 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.2em] bg-bg/80 backdrop-blur-md border border-border/20 text-primary/80"
                  style={{ borderRadius: "var(--theme-radius)" }}
                >
                  módulo
                </span>
              </div>

              <div className="p-8 flex-1 flex flex-col gap-5">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-text group-hover:text-primary/80 transition-colors duration-500 leading-tight flex-1">
                    {item.nombre}
                  </h3>
                </div>

                <p className="text-xs text-text-muted/50 leading-relaxed line-clamp-2 flex-1 font-medium">
                  {item.descripcion}
                </p>

                <div className="pt-6 border-t border-border/5 flex justify-between items-center">
                  <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                    <div className="w-1.5 h-1.5 bg-success/60 rounded-full group-hover:bg-success" />
                    <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">
                      Disponible
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-black text-primary/70 uppercase tracking-[0.2em] group-hover:translate-x-1 transition-transform">
                    VER RETOS
                    <BsChevronRight className="text-[10px]" />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
};
