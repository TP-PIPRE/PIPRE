import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../../infrastructure/api/apiService";
import { getAuthState } from "../../infrastructure/store/authStore";
import { BsExclamationOctagonFill, BsChevronRight } from "react-icons/bs";
import type {
  CourseResponseDTO,
} from "../../infrastructure/api/models/apiModels";

interface ChallengeView {
  id: string;
  idActivity: string;
  title: string;
  description: string;
  order: number;
  difficulty: string;
  points: number;
  courseId?: string;
}

export const CursosPage: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourseChallenges, setSelectedCourseChallenges] = useState<
    ChallengeView[]
  >([]);
  const [isChallengesVisible, setIsChallengesVisible] = useState<string | null>(
    null,
  );
  const [challengePage, setChallengePage] = useState(0);
  const CHALLENGES_PER_PAGE = 10;

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        const data = await apiService.courses.getAll();
        if (data && data.length > 0) {
          setCourses(data);
        }
        setError(null);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("No se pudieron cargar los cursos.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const fetchChallengesFromActivities = async (courseId: string): Promise<ChallengeView[]> => {
    try {
      const modules = await apiService.modules.getByCourse(courseId);
      if (modules.length === 0) return [];
      const challenges: ChallengeView[] = [];
      let order = 0;
      for (const mod of modules) {
        const lessons = await apiService.lessons.getByModule(mod.idModule);
        for (const lesson of lessons) {
          const activities = await apiService.activities.getByLesson(lesson.idLesson);
          for (const act of activities) {
            challenges.push({
              id: act.idActivity,
              idActivity: act.idActivity,
              title: act.name,
              description: "",
              order: order++,
              difficulty: "MEDIUM",
              points: 0,
              courseId,
            });
          }
        }
      }
      return challenges;
    } catch {
      return [];
    }
  };

  const fetchChallenges = async (courseId: string) => {
    setChallengePage(0);
    setSelectedCourseChallenges([]);
    try {
      const authUser = getAuthState().user;
      const userId = authUser?.id || "config-store";
      const sims = await apiService.simulations.getByUser(userId);
      const parsed = sims
        .map((s) => {
          try {
            const data = JSON.parse(s.result);
            if (data.type === "challenge" && data.courseId === courseId && !data.deleted) {
              return {
                id: data.idActivity,
                idActivity: data.idActivity,
                title: data.title || "Sin título",
                description: data.description || "",
                order: data.order || 0,
                difficulty: data.difficulty || "EASY",
                points: data.points || 0,
                courseId,
              } as ChallengeView;
            }
            return null;
          } catch {
            return null;
          }
        })
        .filter((c): c is ChallengeView => c !== null)
        .sort((a, b) => a.order - b.order);
      if (parsed.length > 0) {
        setSelectedCourseChallenges(parsed);
      } else {
        const fallback = await fetchChallengesFromActivities(courseId);
        setSelectedCourseChallenges(fallback);
      }
      setIsChallengesVisible(
        isChallengesVisible === courseId ? null : courseId,
      );
    } catch (err) {
      console.error("Error fetching challenges:", err);
      const fallback = await fetchChallengesFromActivities(courseId);
      setSelectedCourseChallenges(fallback);
      setIsChallengesVisible(
        isChallengesVisible === courseId ? null : courseId,
      );
    }
  };

  if (isLoading) {
    return (
      <div
        className="flex-1 flex items-center justify-center font-mono text-sm"
        style={{ color: "var(--text-muted)" }}
      >
        <span className="animate-pulse">
          Cargando módulos de aprendizaje...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <BsExclamationOctagonFill
          className="text-4xl mb-4"
          style={{ color: "var(--accent)" }}
        />
        <p className="font-mono text-sm mb-4" style={{ color: "var(--text)" }}>
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn-secondary text-xs uppercase tracking-widest"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <main
      className="flex-1 p-6 max-w-7xl mx-auto w-full"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <header className="mb-10">
        <h1
          className="text-xl font-mono font-bold tracking-tight mb-2"
          style={{ color: "var(--text)" }}
        >
          Mis Cursos
        </h1>
        <p
          className="text-sm font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          Explora tus módulos, lecciones y actividades de simulación.
        </p>
      </header>

      {courses.length === 0 ? (
        <div
          className="text-center py-20 border border-dashed border-border rounded-lg"
          style={{ borderRadius: "var(--theme-radius)" }}
        >
          <p
            className="font-mono text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            No tienes cursos asignados actualmente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {courses.map((course) => (
            <div
              key={course.idCourse}
              className="border border-border overflow-hidden group hover:shadow-lg transition-shadow duration-300"
              style={{
                backgroundColor: "var(--surface)",
                borderRadius: "var(--theme-radius)",
              }}
            >
              {/* Header del curso */}
              <div
                className="p-6 border-b border-border transition-colors duration-300"
                style={{ backgroundColor: "var(--surface)" }}
              >
                <div className="flex justify-between items-start mb-4">
                  <h2
                    className="text-lg font-mono font-bold"
                    style={{ color: "var(--text)" }}
                  >
                    {course.name}
                  </h2>
                  <span
                    className="font-mono text-xs"
                    style={{ color: "var(--primary)" }}
                  >
                    0%
                  </span>
                </div>
                <p
                  className="text-xs mb-6 line-clamp-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  {course.description ||
                    "Accede a los contenidos y desafíos de este curso."}
                </p>

                {/* Barra de progreso */}
                <div
                  className="h-1.5 w-full border border-border rounded-full overflow-hidden"
                  style={{ backgroundColor: "var(--border)" }}
                >
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `0%`,
                      backgroundColor: "var(--primary)",
                    }}
                  />
                </div>
              </div>

              {/* Módulos del curso */}
              <div
                className="p-6 space-y-4"
                style={{ backgroundColor: "var(--surface)" }}
              >
                <h3
                  className="text-[10px] font-mono font-bold uppercase tracking-widest mb-4"
                  style={{ color: "var(--text-muted)" }}
                >
                  Módulos Disponibles
                </h3>

                {/* Botón para ver retos */}
                <div
                  onClick={() => fetchChallenges(course.idCourse)}
                  className="flex items-center justify-between p-3 border border-border/50 rounded-lg transition-all cursor-pointer hover:bg-[var(--surface-brighter)]"
                  style={{ borderRadius: "var(--theme-radius)" }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: "var(--primary)" }}
                    />
                    <div>
                      <p
                        className="text-xs font-semibold"
                        style={{ color: "var(--text)" }}
                      >
                        Retos del Curso
                      </p>
                      <p
                        className="text-[10px]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {isChallengesVisible === course.idCourse
                          ? `${selectedCourseChallenges.length} retos disponibles`
                          : "Haz clic para ver los retos"}
                      </p>
                    </div>
                  </div>
                  <BsChevronRight
                    className={`text-lg transition-transform ${
                      isChallengesVisible === course.idCourse
                        ? "rotate-90"
                        : ""
                    }`}
                    style={{ color: "var(--text-muted)" }}
                  />
                </div>

                {/* Lista de retos (si está visible) */}
                {isChallengesVisible === course.idCourse && (
                  <div className="mt-4 space-y-3">
                    {selectedCourseChallenges.length > 0 ? (
                      <>
                        {selectedCourseChallenges
                          .sort((a, b) => a.order - b.order)
                          .slice(challengePage * CHALLENGES_PER_PAGE, (challengePage + 1) * CHALLENGES_PER_PAGE)
                          .map((challenge) => (
                          <div
                            key={challenge.id}
                            className="p-3 bg-[var(--surface-brighter)] border border-border/30 rounded-lg flex justify-between items-center"
                            style={{ borderRadius: "var(--theme-radius)" }}
                          >
                            <div>
                              <p
                                className="text-xs font-semibold"
                                style={{ color: "var(--text)" }}
                              >
                                {challenge.title}
                              </p>
                              <p
                                className="text-[10px] line-clamp-1"
                                style={{ color: "var(--text-muted)" }}
                              >
                                {challenge.description}
                              </p>
                              <div className="flex gap-3 mt-1">
                                <span
                                  className="text-[10px]"
                                  style={{ color: "var(--text-muted)" }}
                                >
                                  Orden: {challenge.order}
                                </span>
                                <span
                                  className="text-[10px]"
                                  style={{ color: "var(--text-muted)" }}
                                >
                                  Dificultad: {challenge.difficulty}
                                </span>
                                <span
                                  className="text-[10px]"
                                  style={{ color: "var(--text-muted)" }}
                                >
                                  Puntos: {challenge.points}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/simulador/${course.idCourse}`);
                              }}
                              className="text-[10px] font-bold uppercase tracking-widest hover:underline"
                              style={{ color: "var(--primary)" }}
                            >
                              Iniciar
                            </button>
                          </div>
                        ))}
                        {selectedCourseChallenges.length > CHALLENGES_PER_PAGE && (
                          <div className="flex items-center justify-between pt-4">
                            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                              {challengePage * CHALLENGES_PER_PAGE + 1}–{Math.min((challengePage + 1) * CHALLENGES_PER_PAGE, selectedCourseChallenges.length)} de {selectedCourseChallenges.length}
                            </span>
                            <div className="flex gap-2">
                              <button
                                disabled={challengePage === 0}
                                onClick={() => setChallengePage(p => Math.max(0, p - 1))}
                                className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider border border-border/20 disabled:opacity-30 hover:border-primary transition-all"
                                style={{ borderRadius: "var(--theme-radius)" }}
                              >
                                ← Anterior
                              </button>
                              <button
                                disabled={(challengePage + 1) * CHALLENGES_PER_PAGE >= selectedCourseChallenges.length}
                                onClick={() => setChallengePage(p => p + 1)}
                                className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider border border-border/20 disabled:opacity-30 hover:border-primary transition-all"
                                style={{ borderRadius: "var(--theme-radius)" }}
                              >
                                Siguiente →
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p
                        className="text-[10px] text-center"
                        style={{ color: "var(--text-muted)" }}
                      >
                        No hay retos disponibles para este curso.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Botón de acción */}
              <div
                className="p-4 border-t border-border flex justify-end transition-colors duration-300"
                style={{ backgroundColor: "var(--surface)" }}
              >
                <button
                  className="text-[10px] font-mono font-bold uppercase tracking-widest hover:underline transition-colors duration-300"
                  style={{ color: "var(--primary)" }}
                >
                  Continuar Aprendizaje
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default CursosPage;
