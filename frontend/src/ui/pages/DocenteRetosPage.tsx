import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { apiService } from "../../infrastructure/api/apiService";
import { getAuthState } from "../../infrastructure/store/authStore";
import type {
  CourseResponseDTO,
  CourseRequestDTO,
  ModuleResponseDTO,
  LessonResponseDTO,
} from "../../infrastructure/api/models/apiModels";
import { Modal } from "../components/common/Modal";

const MOCK_COURSES = [
  {
    idCourse: "1",
    name: "Robótica Nivel 1: Fundamentos (Local)",
    level: "Básico",
    description: "Curso introductorio a la robótica.",
  },
  {
    idCourse: "2",
    name: "Programación de Microcontroladores (Local)",
    level: "Intermedio",
    description: "Curso avanzado de programación.",
  },
  {
    idCourse: "3",
    name: "Diseño y Mecánica de Robots (Local)",
    level: "Avanzado",
    description: "Curso de diseño mecánico.",
  },
];

interface ChallengeView {
  idActivity: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  points: number;
  complexity?: "LOW" | "MEDIUM" | "HIGH";
  logicLevel?: number;
  type?: string;
  deleted?: boolean;
  simulatorConfig?: {
    environment: string;
    maxBlocks: number;
    missions: Array<{ id: string; title: string; objective: string; maxBlocks: number }>;
    allowedHardware?: string[];
    startingPosition?: { x: number; z: number };
    targetPosition?: { x: number; z: number };
  };
  expectedOutput?: string;
  reward?: { type: string; value: number };
}

interface ChallengeFormData {
  title: string;
  description: string;
  order: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  points: number;
  complexity: "LOW" | "MEDIUM" | "HIGH";
  logicLevel: number;
  type: "robotics";
  simulatorConfig: {
    environment: string;
    maxBlocks: number;
    missions: Array<{ id: string; title: string; objective: string; maxBlocks: number }>;
    allowedHardware?: string[];
    startingPosition?: { x: number; z: number };
    targetPosition?: { x: number; z: number };
  };
  expectedOutput: string;
  reward: { type: string; value: number };
}

export const DocenteRetosPage: React.FC = () => {
  const location = useLocation();

  // Estados para cursos
  const [courses, setCourses] = useState<CourseResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalType, setModalType] = useState<
    "create" | "edit" | "delete" | null
  >(null);
  const [selectedCourse, setSelectedCourse] =
    useState<CourseResponseDTO | null>(null);
  const [formData, setFormData] = useState<Omit<CourseRequestDTO, "idCourse">>(
    {
      name: "",
      description: "",
      level: "BASIC",
    },
  );

  // Estados para retos
  const [selectedCourseChallenges, setSelectedCourseChallenges] = useState<
    ChallengeView[]
  >([]);
  const [isChallengesModalOpen, setIsChallengesModalOpen] = useState(false);
  const [challengeModalType, setChallengeModalType] = useState<
    "create" | "edit" | null
  >(null);
  const [selectedChallenge, setSelectedChallenge] =
    useState<ChallengeView | null>(null);
  const [challengeFormData, setChallengeFormData] =
    useState<ChallengeFormData>({
    title: "",
    description: "",
    order: 0,
    difficulty: "EASY",
    points: 0,
    complexity: "MEDIUM",
    logicLevel: 3,
    type: "robotics",
    simulatorConfig: {
      environment: "obstacle",
      maxBlocks: 10,
      missions: [{ id: "m1", title: "Misión 1", objective: "", maxBlocks: 5 }],
    },
    expectedOutput: "",
    reward: { type: "POINTS", value: 0 },
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [modules, setModules] = useState<ModuleResponseDTO[]>([]);
  const [lessons, setLessons] = useState<LessonResponseDTO[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [selectedLessonId, setSelectedLessonId] = useState<string>("");

  // Paginación de retos
  const [challengePage, setChallengePage] = useState(0);
  const CHALLENGES_PER_PAGE = 10;

  // Cargar cursos
  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.courses.getAll();
      if (data && data.length > 0) {
        setCourses(data);
      } else {
        setCourses(MOCK_COURSES as unknown as CourseResponseDTO[]);
      }
    } catch (err) {
      console.error("Error fetching courses, using fallback:", err);
      setCourses(MOCK_COURSES as unknown as CourseResponseDTO[]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback: fetch activities as challenges via modules->lessons->activities
  const fetchChallengesFromActivities = async (courseId: string): Promise<ChallengeView[]> => {
    try {
      const modules = await apiService.modules.getByCourse(courseId);
      const challenges: ChallengeView[] = [];
      let order = 0;
      for (const mod of modules) {
        const lessons = await apiService.lessons.getByModule(mod.idModule);
        for (const lesson of lessons) {
          const activities = await apiService.activities.getByLesson(lesson.idLesson);
          for (const act of activities) {
            challenges.push({
              idActivity: act.idActivity,
              courseId,
              title: act.name,
              description: "",
              order: order++,
              difficulty: "MEDIUM",
              points: 0,
            });
          }
        }
      }
      return challenges;
    } catch {
      return [];
    }
  };

  // Cargar retos de un curso desde simulations API
  const fetchChallengesByCourse = async (courseId: string) => {
    try {
      const authUser = getAuthState().user;
      const userId = authUser?.id || "config-store";
      const sims = await apiService.simulations.getByUser(userId);
      const parsed = sims
        .map((s) => {
          try {
            const data = JSON.parse(s.result);
            return { ...data, id_simulation: s.id_simulation } as ChallengeView;
          } catch {
            return null;
          }
        })
        .filter((c): c is ChallengeView =>
          c !== null && c.type === "challenge" && c.courseId === courseId && !c.deleted
        )
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      if (parsed.length === 0) {
        const fallback = await fetchChallengesFromActivities(courseId);
        setSelectedCourseChallenges(fallback);
      } else {
        setSelectedCourseChallenges(parsed);
      }
      setChallengePage(0);
    } catch (err) {
      console.error("Error fetching challenges:", err);
      const fallback = await fetchChallengesFromActivities(courseId);
      setSelectedCourseChallenges(fallback);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Auto-select course from route state (e.g. edit button in DocenteDashboard)
  useEffect(() => {
    const courseId = (location.state as { courseId?: string })?.courseId;
    if (courseId && courses.length > 0) {
      const course = courses.find((c) => c.idCourse === courseId);
      if (course) {
        setChallengePage(0);
        setSelectedCourse(course);
        setIsChallengesModalOpen(true);
        fetchChallengesByCourse(course.idCourse);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, courses]);

  // Manejar envío de curso
  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalType === "create") {
        await apiService.courses.create(formData as CourseRequestDTO);
      } else if (modalType === "edit" && selectedCourse) {
        await apiService.courses.update({
          ...formData,
          idCourse: selectedCourse.idCourse,
        } as CourseRequestDTO & { idCourse: string });
      }
      setModalType(null);
      fetchCourses();
    } catch (err) {
      console.error("Error saving course:", err);
    }
  };

  // Validar formulario de reto
  const validateChallengeForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!challengeFormData.title?.trim()) errors.title = "El título es obligatorio";
    if (!challengeFormData.description?.trim()) errors.description = "La descripción es obligatoria";
    if (!challengeFormData.order || challengeFormData.order < 1) errors.order = "El orden debe ser ≥ 1";
    if (!challengeFormData.points || challengeFormData.points < 1) errors.points = "Los puntos deben ser > 0";
    if (!challengeFormData.difficulty) errors.difficulty = "Selecciona una dificultad";
    const sim = challengeFormData.simulatorConfig;
    if (sim) {
      if (!sim.environment) errors.environment = "Selecciona un entorno";
      if (!sim.maxBlocks || sim.maxBlocks < 1) errors.maxBlocks = "El límite de bloques debe ser ≥ 1";
      if (sim.missions && sim.missions.length === 0) errors.missions = "Agrega al menos una misión";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Agregar misión al config visual
  const addMissionToConfig = () => {
    setChallengeFormData((prev) => {
      const sim = prev.simulatorConfig || {};
      const missions = sim.missions || [];
      const newId = `m${missions.length + 1}`;
      return {
        ...prev,
        simulatorConfig: {
          ...sim,
          missions: [...missions, { id: newId, title: `Misión ${missions.length + 1}`, objective: "", maxBlocks: 5 }],
        },
      };
    });
  };

  // Eliminar misión del config visual
  const removeMissionFromConfig = (missionId: string) => {
    setChallengeFormData((prev) => {
      const sim = prev.simulatorConfig || {};
      const missions = (sim.missions || []).filter((m: any) => m.id !== missionId);
      return { ...prev, simulatorConfig: { ...sim, missions } };
    });
  };

  // Actualizar una misión en el config visual
  const updateMissionInConfig = (missionId: string, field: string, value: string | number) => {
    setChallengeFormData((prev) => {
      const sim = prev.simulatorConfig || {};
      const missions = (sim.missions || []).map((m: any) =>
        m.id === missionId ? { ...m, [field]: value } : m,
      );
      return { ...prev, simulatorConfig: { ...sim, missions } };
    });
  };

  // Reordenar retos — mover arriba/abajo y persistir
  const moveChallengeOrder = async (idActivity: string, direction: "up" | "down") => {
    try {
      const sorted = [...selectedCourseChallenges].sort((a, b) => a.order - b.order);
      const currentIdx = sorted.findIndex((c) => c.idActivity === idActivity);
      if (currentIdx < 0) return;
      if (direction === "up" && currentIdx > 0) {
        const temp = sorted[currentIdx].order;
        sorted[currentIdx].order = sorted[currentIdx - 1].order;
        sorted[currentIdx - 1].order = temp;
      } else if (direction === "down" && currentIdx < sorted.length - 1) {
        const temp = sorted[currentIdx].order;
        sorted[currentIdx].order = sorted[currentIdx + 1].order;
        sorted[currentIdx + 1].order = temp;
      } else {
        return;
      }
      // Persistir reorden: actualizar ambos retos afectados
      const toUpdate = [sorted[currentIdx], direction === "up" ? sorted[currentIdx - 1] : sorted[currentIdx + 1]];
      const authUser = getAuthState().user;
      const userId = authUser?.id || "config-store";
      const sims = await apiService.simulations.getByUser(userId);
      for (const ch of toUpdate) {
        const existing = sims.find((s) => {
          try { const r = JSON.parse(s.result); return r.idActivity === ch.idActivity; }
          catch { return false; }
        });
        if (existing) {
          const data = JSON.parse(existing.result);
          data.order = ch.order;
          data.updatedAt = new Date().toISOString();
          await apiService.simulations.postResult({
            id_student: userId,
            id_activity: ch.idActivity,
            result: JSON.stringify(data),
          });
        }
      }
      setSelectedCourseChallenges([...sorted]);
    } catch (err) {
      console.error("Error reordering challenges:", err);
    }
  };

  // Cargar módulos de un curso
  const fetchModulesForCourse = async (courseId: string) => {
    try {
      const data = await apiService.modules.getByCourse(courseId);
      setModules(data);
      if (data.length > 0) {
        setSelectedModuleId(data[0].idModule);
        const les = await apiService.lessons.getByModule(data[0].idModule);
        setLessons(les);
        if (les.length > 0) setSelectedLessonId(les[0].idLesson);
      }
    } catch {
      setModules([]);
      setLessons([]);
    }
  };

  const handleChallengeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateChallengeForm()) return;
    try {
      if (!selectedCourse) return;

      const authUser = getAuthState().user;
      const idStudent = authUser?.id || "config-store";

      let idActivity = selectedChallenge?.idActivity || "";

      if (!selectedLessonId) {
        await fetchModulesForCourse(selectedCourse.idCourse);
        if (!selectedLessonId) {
          console.error("No se encontraron lecciones para este curso");
          return;
        }
      }

      if (challengeModalType === "create" || !idActivity) {
        const created = await apiService.activities.create({
          idLesson: selectedLessonId,
          name: challengeFormData.title,
        });
        idActivity = created.idActivity;
      }

      const payload = {
        type: "challenge",
        idActivity,
        courseId: selectedCourse.idCourse,
        title: challengeFormData.title,
        description: challengeFormData.description,
        order: challengeFormData.order,
        difficulty: challengeFormData.difficulty,
        complexity: challengeFormData.complexity,
        logicLevel: challengeFormData.logicLevel,
        points: challengeFormData.points,
        environment: challengeFormData.simulatorConfig?.environment || "obstacle",
        maxBlocks: challengeFormData.simulatorConfig?.maxBlocks || 10,
        missions: challengeFormData.simulatorConfig?.missions || [],
        allowedHardware: challengeFormData.simulatorConfig?.allowedHardware || [],
        startingPosition: challengeFormData.simulatorConfig?.startingPosition || { x: 0, z: 0 },
        targetPosition: challengeFormData.simulatorConfig?.targetPosition || { x: 10, z: 10 },
        expectedOutput: challengeFormData.expectedOutput,
        reward: challengeFormData.reward,
        deleted: false,
        createdAt: selectedChallenge?.idActivity ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await apiService.simulations.postResult({
        id_student: idStudent,
        id_activity: idActivity,
        result: JSON.stringify(payload),
      });

      setChallengeModalType(null);
      setFormErrors({});
      fetchChallengesByCourse(selectedCourse.idCourse);
    } catch (err) {
      console.error("Error saving challenge:", err);
    }
  };

  // Eliminar curso
  const handleDeleteCourse = async () => {
    if (selectedCourse) {
      try {
        await apiService.courses.delete(selectedCourse.idCourse);
        setCourses((prev) =>
          prev.filter((c) => c.idCourse !== selectedCourse.idCourse),
        );
      } catch (err) {
        console.error("Error deleting course:", err);
      }
      setModalType(null);
    }
  };

  // Eliminar reto (activities API + soft delete via simulations)
  const handleDeleteChallenge = async (idActivity: string) => {
    try {
      const courseId = selectedCourse!.idCourse;
      const authUser = getAuthState().user;
      const userId = authUser?.id || "config-store";
      await apiService.simulations.postResult({
        id_student: userId,
        id_activity: idActivity,
        result: JSON.stringify({ deleted: true, type: "challenge", courseId }),
      });
      fetchChallengesByCourse(courseId);
    } catch (err) {
      console.error("Error deleting challenge:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center font-mono text-[10px] uppercase tracking-widest opacity-40 animate-pulse">
        Sincronizando Nodo...
      </div>
    );
  }

  return (
    <main className="flex-1 p-8 max-w-7xl mx-auto w-full animate-fade-in-soft">
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Gestión de <span className="text-primary/80">Retos</span>
          </h1>
          <p className="text-xs text-text-muted/60 max-w-md font-medium">
            Administración centralizada de la arquitectura educativa PMV01.
          </p>
        </div>
        <button
          onClick={() => {
            setModalType("create");
            setFormData({ name: "", description: "", level: "BASIC" });
          }}
          className="btn-premium px-8 py-3.5 text-[10px] tracking-[0.2em] font-black active:scale-95 transition-all shadow-xl hover:shadow-primary/10"
          style={{ borderRadius: "var(--theme-radius)" }}
        >
          ALTA DE CURSO
        </button>
      </header>

      {/* Modal para Cursos */}
      <Modal
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        maxWidth={modalType === "delete" ? "max-w-lg" : "max-w-2xl"}
      >
        <div className="flex flex-col">
          {modalType !== "delete" && (
            <div className="relative h-32 bg-primary/10 overflow-hidden flex items-center justify-center border-b border-border/10">
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "radial-gradient(var(--theme-primary) 1px, transparent 1px)",
                    backgroundSize: "15px 15px",
                  }}
                />
              </div>
              <div className="relative text-center">
                <span className="text-[9px] font-black text-primary uppercase tracking-[0.4em] mb-2 block animate-fade-in-soft">
                  {modalType === "create"
                    ? "Configuración de Nodo"
                    : "Modificación de Arquitectura"}
                </span>
                <h2 className="text-2xl font-bold tracking-tight">
                  {modalType === "create"
                    ? "Nuevo Reto Educativo"
                    : "Editar Especificaciones"}
                </h2>
              </div>
            </div>
          )}

          <div className="p-10">
            {modalType === "delete" ? (
              <div className="text-center py-6">
                <div className="w-20 h-20 bg-danger/10 text-danger rounded-2xl flex items-center justify-center mx-auto mb-8 rotate-3 hover:rotate-0 transition-transform duration-500">
                  <span className="material-symbols-outlined text-4xl">
                    delete_forever
                  </span>
                </div>
                <h2 className="text-2xl font-bold mb-3">
                  ¿Confirmar Eliminación?
                </h2>
                <p className="text-sm text-text-muted/70 mb-10 px-6 leading-relaxed">
                  Esta acción desactivará permanentemente el nodo{" "}
                  <span className="text-text font-bold">
                    "{selectedCourse?.name}"
                  </span>
                  . Esta operación es irreversible.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setModalType(null)}
                    className="flex-1 btn-secondary py-4 text-[10px] font-bold uppercase tracking-widest"
                  >
                    CANCELAR
                  </button>
                  <button
                    onClick={handleDeleteCourse}
                    className="flex-1 bg-danger text-white hover:brightness-110 py-4 text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-danger/20 transition-all active:scale-95"
                    style={{ borderRadius: "var(--theme-radius)" }}
                  >
                    ELIMINAR NODO
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCourseSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] uppercase tracking-widest text-text-muted/60 font-black ml-1">
                      Identificador del Curso
                    </label>
                    <input
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full bg-bg/50 border border-border/30 px-6 py-4 text-sm focus:border-primary outline-none transition-all placeholder:opacity-30"
                      style={{ borderRadius: "var(--theme-radius)" }}
                      placeholder="Ej: Robótica Autónoma v2"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] uppercase tracking-widest text-text-muted/60 font-black ml-1">
                      Nivel de Complejidad
                    </label>
                    <div className="relative">
                      <select
                        value={formData.level}
                        onChange={(e) =>
                          setFormData({ ...formData, level: e.target.value })
                        }
                        className="w-full bg-bg/50 border border-border/30 px-6 py-4 text-sm focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                        style={{ borderRadius: "var(--theme-radius)" }}
                      >
                        <option value="BASIC">
                          Protocolo Básico (Fundamentos)
                        </option>
                        <option value="INTERMEDIATE">
                          Protocolo Intermedio (Control)
                        </option>
                        <option value="ADVANCED">
                          Protocolo Avanzado (Sistemas)
                        </option>
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted/40">
                        expand_more
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] uppercase tracking-widest text-text-muted/60 font-black ml-1">
                      Descripción Técnica
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full bg-bg/50 border border-border/30 px-6 py-4 text-sm focus:border-primary outline-none transition-all min-h-[140px] placeholder:opacity-30 resize-none"
                      style={{ borderRadius: "var(--theme-radius)" }}
                      placeholder="Define los objetivos y alcances del curso..."
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="flex-1 btn-secondary py-5 text-[10px] font-black tracking-widest"
                  >
                    DESCARTAR
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] btn-premium py-5 text-[10px] font-black tracking-[0.3em] shadow-xl shadow-primary/20"
                  >
                    {modalType === "create"
                      ? "SINCRONIZAR NODO"
                      : "GUARDAR CAMBIOS"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal para Retos */}
      <Modal
        isOpen={isChallengesModalOpen}
        onClose={() => {
          setIsChallengesModalOpen(false);
          setChallengeModalType(null);
        }}
        maxWidth="max-w-4xl"
      >
        <div className="flex flex-col">
          {/* Header del modal (igual que antes) */}
          <div className="relative h-32 bg-primary/10 overflow-hidden flex items-center justify-center border-b border-border/10">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "radial-gradient(var(--theme-primary) 1px, transparent 1px)",
                  backgroundSize: "15px 15px",
                }}
              />
            </div>
            <div className="relative text-center">
              <span className="text-[9px] font-black text-primary uppercase tracking-[0.4em] mb-2 block animate-fade-in-soft">
                {challengeModalType
                  ? challengeModalType === "create"
                    ? "Nuevo Reto"
                    : "Editar Reto"
                  : "Gestión de Retos"}
              </span>
              <h2 className="text-2xl font-bold tracking-tight">
                {challengeModalType
                  ? challengeModalType === "create"
                    ? "Crear Reto"
                    : `Editar: ${selectedChallenge?.title}`
                  : `Retos para: ${selectedCourse?.name}`}
              </h2>
            </div>
          </div>

          <div className="p-10">
            {/* Si NO estamos en modo crear/editar, mostramos la lista de retos + botón "Nuevo Reto" */}
            {!challengeModalType ? (
              <>
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold">Retos Existentes</h3>
                    <button
                      onClick={() => {
                        setChallengeModalType("create");
                        setFormErrors({});
                        setChallengeFormData({
                          title: "",
                          description: "",
                          order: selectedCourseChallenges.length + 1,
                          difficulty: "EASY",
                          points: 0,
                          complexity: "MEDIUM",
                          logicLevel: 3,
                          type: "robotics",
                          simulatorConfig: {
                            environment: "obstacle",
                            maxBlocks: 10,
                            missions: [{ id: "m1", title: "Misión 1", objective: "", maxBlocks: 5 }],
                          },
                          expectedOutput: "",
                          reward: { type: "POINTS", value: 0 },
                        });
                        if (selectedCourse) fetchModulesForCourse(selectedCourse.idCourse);
                      }}
                      className="btn-premium px-4 py-2 text-[10px] font-bold uppercase tracking-widest"
                    >
                      + Nuevo Reto
                    </button>
                  </div>

                  {selectedCourseChallenges.length > 0 ? (
                    <>
                      <div className="space-y-4">
                        {[...selectedCourseChallenges]
                          .sort((a, b) => a.order - b.order)
                          .slice(challengePage * CHALLENGES_PER_PAGE, (challengePage + 1) * CHALLENGES_PER_PAGE)
                          .map((challenge) => (
                            <div
                              key={challenge.idActivity}
                              className="p-4 bg-bg/50 border border-border/20 rounded-lg flex justify-between items-center"
                              style={{ borderRadius: "var(--theme-radius)" }}
                            >
                              <div>
                                <p className="font-semibold">{challenge.title}</p>
                                <p className="text-xs text-text-muted">
                                  {challenge.description}
                                </p>
                                <div className="flex gap-3 mt-1 text-[10px] text-text-muted">
                                  <span>Orden: {challenge.order}</span>
                                  <span>Dificultad: {challenge.difficulty}</span>
                                  <span>Puntos: {challenge.points}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex flex-col gap-0.5 mr-1">
                                  <button
                                    type="button"
                                    onClick={() => moveChallengeOrder(challenge.idActivity, "up")}
                                    className="text-text-muted/30 hover:text-primary text-[10px] leading-none"
                                    title="Subir orden"
                                  >
                                    ▲
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveChallengeOrder(challenge.idActivity, "down")}
                                    className="text-text-muted/30 hover:text-primary text-[10px] leading-none"
                                    title="Bajar orden"
                                  >
                                    ▼
                                  </button>
                                </div>
                                <button
                                  onClick={() => {
                                    setChallengeModalType("edit");
                                    setFormErrors({});
                                    setSelectedChallenge(challenge);
                                    const sim = challenge.simulatorConfig || {};
                                    setChallengeFormData({
                                      title: challenge.title,
                                      description: challenge.description,
                                      order: challenge.order,
                                      difficulty: challenge.difficulty,
                                      points: challenge.points,
                                      complexity: challenge.complexity || "MEDIUM",
                                      logicLevel: challenge.logicLevel ?? 3,
                                      type: "robotics",
                                      simulatorConfig: {
                                        environment: (sim as any).environment || "battle",
                                        maxBlocks: (sim as any).maxBlocks || 10,
                                        missions: (sim as any).missions || [{ id: "m1", title: "Misión 1", objective: "", maxBlocks: 5 }],
                                        allowedHardware: (sim as any).allowedHardware || [],
                                        startingPosition: (sim as any).startingPosition || { x: 0, z: 0 },
                                        targetPosition: (sim as any).targetPosition || { x: 10, z: 10 },
                                      },
                                      expectedOutput: challenge.expectedOutput || "",
                                      reward: challenge.reward || { type: "POINTS", value: 0 },
                                    });
                                    if (selectedCourse) fetchModulesForCourse(selectedCourse.idCourse);
                                  }}
                                  className="text-primary hover:underline text-xs"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteChallenge(challenge.idActivity)
                                  }
                                  className="text-danger hover:underline text-xs"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                      {selectedCourseChallenges.length > CHALLENGES_PER_PAGE && (
                        <div className="flex items-center justify-between pt-4 border-t border-border/10">
                          <span className="text-[10px] text-text-muted">
                            {challengePage * CHALLENGES_PER_PAGE + 1}–{Math.min((challengePage + 1) * CHALLENGES_PER_PAGE, selectedCourseChallenges.length)} de {selectedCourseChallenges.length}
                          </span>
                          <div className="flex gap-2">
                            <button
                              disabled={challengePage === 0}
                              onClick={() => setChallengePage(p => Math.max(0, p - 1))}
                              className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider border border-border/20 disabled:opacity-30 hover:border-primary transition-all rounded"
                            >
                              ← Anterior
                            </button>
                            <button
                              disabled={(challengePage + 1) * CHALLENGES_PER_PAGE >= selectedCourseChallenges.length}
                              onClick={() => setChallengePage(p => p + 1)}
                              className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider border border-border/20 disabled:opacity-30 hover:border-primary transition-all rounded"
                            >
                              Siguiente →
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-[10px] text-center text-text-muted">
                      No hay retos disponibles para este curso. Crea uno nuevo.
                    </p>
                  )}
                </div>
              </>
            ) : (
              // ✅ Formulario integrado (sin fondo negro, mismo estilo que el modal)
              <form onSubmit={handleChallengeSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-text-muted/60 font-black ml-1">
                      Módulo
                    </label>
                    <select
                      value={selectedModuleId}
                      onChange={async (e) => {
                        setSelectedModuleId(e.target.value);
                        try {
                          const les = await apiService.lessons.getByModule(e.target.value);
                          setLessons(les);
                          if (les.length > 0) setSelectedLessonId(les[0].idLesson);
                        } catch { setLessons([]); }
                      }}
                      className="w-full bg-bg/50 border border-border/30 px-4 py-2 text-sm focus:border-primary outline-none transition-all"
                      style={{ borderRadius: "var(--theme-radius)" }}
                    >
                      {modules.map((m) => (
                        <option key={m.idModule} value={m.idModule}>{m.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-text-muted/60 font-black ml-1">
                      Lección
                    </label>
                    <select
                      value={selectedLessonId}
                      onChange={(e) => setSelectedLessonId(e.target.value)}
                      className="w-full bg-bg/50 border border-border/30 px-4 py-2 text-sm focus:border-primary outline-none transition-all"
                      style={{ borderRadius: "var(--theme-radius)" }}
                    >
                      {lessons.map((l) => (
                        <option key={l.idLesson} value={l.idLesson}>{l.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-text-muted/60 font-black ml-1">
                      Título
                    </label>
                    <input
                      required
                      value={challengeFormData.title || ""}
                      onChange={(e) =>
                        setChallengeFormData({
                          ...challengeFormData,
                          title: e.target.value,
                        })
                      }
                      className="w-full bg-bg/50 border border-border/30 px-4 py-2 text-sm focus:border-primary outline-none transition-all"
                      style={{ borderRadius: "var(--theme-radius)" }}
                      placeholder="Ej: Mueve el robot 5 pasos"
                    />
                    {formErrors.title && <p className="text-danger text-[9px] mt-1">{formErrors.title}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-text-muted/60 font-black ml-1">
                      Orden
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={challengeFormData.order || 0}
                      onChange={(e) =>
                        setChallengeFormData({
                          ...challengeFormData,
                          order: Number(e.target.value),
                        })
                      }
                      className="w-full bg-bg/50 border border-border/30 px-4 py-2 text-sm focus:border-primary outline-none transition-all"
                      style={{ borderRadius: "var(--theme-radius)" }}
                      placeholder="Ej: 1"
                    />
                    {formErrors.order && <p className="text-danger text-[9px] mt-1">{formErrors.order}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-text-muted/60 font-black ml-1">
                      Dificultad
                    </label>
                    <select
                      value={challengeFormData.difficulty || "EASY"}
                      onChange={(e) =>
                        setChallengeFormData({
                          ...challengeFormData,
                          difficulty: e.target.value as
                            | "EASY"
                            | "MEDIUM"
                            | "HARD",
                        })
                      }
                      className="w-full bg-bg/50 border border-border/30 px-4 py-2 text-sm focus:border-primary outline-none transition-all"
                      style={{ borderRadius: "var(--theme-radius)" }}
                    >
                      <option value="EASY">Fácil</option>
                      <option value="MEDIUM">Intermedio</option>
                      <option value="HARD">Avanzado</option>
                    </select>
                    {formErrors.difficulty && <p className="text-danger text-[9px] mt-1">{formErrors.difficulty}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-text-muted/60 font-black ml-1">
                      Puntos
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={challengeFormData.points || 0}
                      onChange={(e) =>
                        setChallengeFormData({
                          ...challengeFormData,
                          points: Number(e.target.value),
                        })
                      }
                      className="w-full bg-bg/50 border border-border/30 px-4 py-2 text-sm focus:border-primary outline-none transition-all"
                      style={{ borderRadius: "var(--theme-radius)" }}
                      placeholder="Ej: 50"
                    />
                    {formErrors.points && <p className="text-danger text-[9px] mt-1">{formErrors.points}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-text-muted/60 font-black ml-1">
                      Complejidad
                    </label>
                    <select
                      value={challengeFormData.complexity || "MEDIUM"}
                      onChange={(e) =>
                        setChallengeFormData({
                          ...challengeFormData,
                          complexity: e.target.value as "LOW" | "MEDIUM" | "HIGH",
                        })
                      }
                      className="w-full bg-bg/50 border border-border/30 px-4 py-2 text-sm focus:border-primary outline-none transition-all"
                      style={{ borderRadius: "var(--theme-radius)" }}
                    >
                      <option value="LOW">Baja</option>
                      <option value="MEDIUM">Media</option>
                      <option value="HIGH">Alta</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-text-muted/60 font-black ml-1">
                      Nivel Lógico
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={challengeFormData.logicLevel || 3}
                      onChange={(e) =>
                        setChallengeFormData({
                          ...challengeFormData,
                          logicLevel: Number(e.target.value),
                        })
                      }
                      className="w-full bg-bg/50 border border-border/30 px-4 py-2 text-sm focus:border-primary outline-none transition-all"
                      style={{ borderRadius: "var(--theme-radius)" }}
                      placeholder="Ej: 3"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] uppercase tracking-widest text-text-muted/60 font-black ml-1">
                      Descripción
                    </label>
                    <textarea
                      required
                      value={challengeFormData.description || ""}
                      onChange={(e) =>
                        setChallengeFormData({
                          ...challengeFormData,
                          description: e.target.value,
                        })
                      }
                      className="w-full bg-bg/50 border border-border/30 px-4 py-2 text-sm focus:border-primary outline-none transition-all min-h-[100px] resize-none"
                      style={{ borderRadius: "var(--theme-radius)" }}
                      placeholder="Describe el objetivo del reto..."
                    />
                    {formErrors.description && <p className="text-danger text-[9px] mt-1">{formErrors.description}</p>}
                  </div>
                  <div className="space-y-4 md:col-span-2 border border-border/20 p-4" style={{ borderRadius: "var(--theme-radius)" }}>
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-widest text-text-muted/60 font-black">
                        Configuración del Simulador
                      </label>
                      <span className="text-[8px] text-text-muted/30 font-mono">Editor visual</span>
                    </div>

                    {/* Environment */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] uppercase tracking-widest text-text-muted/50 font-bold ml-1">Entorno</label>
                        <select
                          value={challengeFormData.simulatorConfig?.environment || "battle"}
                          onChange={(e) =>
                            setChallengeFormData({
                              ...challengeFormData,
                              simulatorConfig: { ...challengeFormData.simulatorConfig, environment: e.target.value },
                            })
                          }
                          className="w-full bg-bg/50 border border-border/30 px-4 py-2 text-sm focus:border-primary outline-none transition-all mt-1"
                          style={{ borderRadius: "var(--theme-radius)" }}
                        >
                          <option value="battle">⚔️ Batalla de Robots</option>
                          <option value="space">🚀 Exploración Espacial</option>
                          <option value="maze">🔮 Laberinto Mágico</option>
                          <option value="obstacle">🏁 Carrera de Obstáculos</option>
                        </select>
                        {formErrors.environment && <p className="text-danger text-[9px] mt-1">{formErrors.environment}</p>}
                      </div>

                      <div>
                        <label className="text-[9px] uppercase tracking-widest text-text-muted/50 font-bold ml-1">Límite de Bloques</label>
                        <input
                          type="number"
                          min={1}
                          value={challengeFormData.simulatorConfig?.maxBlocks || 10}
                          onChange={(e) =>
                            setChallengeFormData({
                              ...challengeFormData,
                              simulatorConfig: { ...challengeFormData.simulatorConfig, maxBlocks: Number(e.target.value) },
                            })
                          }
                          className="w-full bg-bg/50 border border-border/30 px-4 py-2 text-sm focus:border-primary outline-none transition-all mt-1"
                          style={{ borderRadius: "var(--theme-radius)" }}
                        />
                        {formErrors.maxBlocks && <p className="text-danger text-[9px] mt-1">{formErrors.maxBlocks}</p>}
                      </div>
                    </div>

                    {/* Misiones */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[9px] uppercase tracking-widest text-text-muted/50 font-bold ml-1">Misiones</label>
                        <button
                          type="button"
                          onClick={addMissionToConfig}
                          className="text-[9px] font-bold uppercase tracking-widest text-primary hover:underline"
                        >
                          + Agregar
                        </button>
                      </div>
                      {formErrors.missions && <p className="text-danger text-[9px] mb-2">{formErrors.missions}</p>}

                      {(challengeFormData.simulatorConfig?.missions || []).map((mission: any, _mi: number) => (
                        <div key={mission.id} className="flex gap-2 items-start mb-2 p-2 bg-bg/30 border border-border/10" style={{ borderRadius: "var(--theme-radius)" }}>
                          <div className="flex-1 space-y-1">
                            <input
                              placeholder="Título de la misión"
                              value={mission.title}
                              onChange={(e) => updateMissionInConfig(mission.id, "title", e.target.value)}
                              className="w-full bg-bg/50 border border-border/20 px-2 py-1 text-xs focus:border-primary outline-none"
                              style={{ borderRadius: "var(--theme-radius)" }}
                            />
                            <input
                              placeholder="Objetivo"
                              value={mission.objective}
                              onChange={(e) => updateMissionInConfig(mission.id, "objective", e.target.value)}
                              className="w-full bg-bg/50 border border-border/20 px-2 py-1 text-xs focus:border-primary outline-none"
                              style={{ borderRadius: "var(--theme-radius)" }}
                            />
                          </div>
                          <div className="w-16">
                            <label className="text-[8px] text-text-muted/50 block mb-0.5">Bloques</label>
                            <input
                              type="number"
                              min={1}
                              value={mission.maxBlocks}
                              onChange={(e) => updateMissionInConfig(mission.id, "maxBlocks", Number(e.target.value))}
                              className="w-full bg-bg/50 border border-border/20 px-2 py-1 text-xs focus:border-primary outline-none"
                              style={{ borderRadius: "var(--theme-radius)" }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeMissionFromConfig(mission.id)}
                            className="text-danger/50 hover:text-danger text-xs mt-2"
                            disabled={(challengeFormData.simulatorConfig?.missions || []).length <= 1}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] uppercase tracking-widest text-text-muted/60 font-black ml-1">
                      Resultado Esperado
                    </label>
                    <input
                      value={challengeFormData.expectedOutput || ""}
                      onChange={(e) =>
                        setChallengeFormData({
                          ...challengeFormData,
                          expectedOutput: e.target.value,
                        })
                      }
                      className="w-full bg-bg/50 border border-border/30 px-4 py-2 text-sm focus:border-primary outline-none transition-all"
                      style={{ borderRadius: "var(--theme-radius)" }}
                      placeholder="Ej: robot.llegarADestino()"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setChallengeModalType(null)}
                    className="flex-1 btn-secondary py-3 text-[10px] font-bold uppercase tracking-widest"
                  >
                    CANCELAR
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-premium py-3 text-[10px] font-bold uppercase tracking-widest"
                  >
                    {challengeModalType === "create"
                      ? "CREAR RETO"
                      : "GUARDAR CAMBIOS"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </Modal>

      {/* LISTADO DE CURSOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map((course) => (
          <div
            key={course.idCourse}
            className="group relative bg-surface/40 border border-border/20 p-8 transition-all duration-700 hover:border-primary/30 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden"
            style={{ borderRadius: "var(--theme-radius)" }}
          >
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div
                  className="w-14 h-14 flex items-center justify-center bg-bg/60 border border-border/10 group-hover:border-primary/30 transition-all duration-500"
                  style={{ borderRadius: "var(--theme-radius)" }}
                >
                  <span className="material-symbols-outlined text-primary/60 group-hover:text-primary group-hover:scale-110 transition-all">
                    terminal
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setModalType("edit");
                      setSelectedCourse(course);
                      setFormData({
                        name: course.name,
                        description: course.description || "",
                        level: course.level || "BASIC",
                      });
                    }}
                    className="w-9 h-9 flex items-center justify-center bg-bg/40 border border-border/10 hover:border-primary/40 hover:text-primary transition-all active:scale-90"
                    style={{ borderRadius: "var(--theme-radius)" }}
                  >
                    <span className="material-symbols-outlined text-base">
                      edit
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setModalType("delete");
                      setSelectedCourse(course);
                    }}
                    className="w-9 h-9 flex items-center justify-center bg-bg/40 border border-border/10 hover:border-danger/40 hover:text-danger transition-all active:scale-90"
                    style={{ borderRadius: "var(--theme-radius)" }}
                  >
                    <span className="material-symbols-outlined text-base">
                      delete
                    </span>
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold mb-3 group-hover:text-primary/90 transition-colors">
                {course.name}
              </h3>

              <div className="flex items-center gap-5 text-[10px] font-mono uppercase tracking-[0.15em] text-text-muted/40 mb-8">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-success/60 rounded-full group-hover:bg-success group-hover:animate-pulse transition-colors" />
                  Online
                </span>
                <span>Node: {(course.idCourse || "").split("-")[0]}</span>
              </div>

              <div className="flex gap-4 pt-6 border-t border-border/10">
                <button
                  onClick={() => {
                    setChallengePage(0);
                    setSelectedCourse(course);
                    fetchChallengesByCourse(course.idCourse);
                    setIsChallengesModalOpen(true);
                  }}
                  className="flex-1 text-[10px] font-black uppercase tracking-widest py-3 bg-bg/60 border border-border/10 hover:border-primary/30 hover:bg-primary/5 transition-all active:scale-95"
                  style={{ borderRadius: "var(--theme-radius)" }}
                >
                  Retos
                </button>
                <button
                  className="flex-1 text-[10px] font-black uppercase tracking-widest py-3 border border-border/10 hover:border-primary/30 transition-all active:scale-95"
                  style={{ borderRadius: "var(--theme-radius)" }}
                >
                  Detalles
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* CARD DE AGREGAR RÁPIDO */}
        <div
          onClick={() => {
            setModalType("create");
            setFormData({ name: "", description: "", level: "BASIC" });
          }}
          className="border-2 border-dashed border-border/20 p-8 flex flex-col items-center justify-center gap-5 text-text-muted/30 hover:border-primary/30 hover:text-primary/60 hover:bg-primary/5 transition-all cursor-pointer group"
          style={{ borderRadius: "var(--theme-radius)" }}
        >
          <div className="w-16 h-16 rounded-full border border-dashed border-border/20 flex items-center justify-center group-hover:scale-110 group-hover:border-primary/30 transition-all duration-500">
            <span className="material-symbols-outlined text-4xl">add</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60 group-hover:opacity-100 transition-opacity">
            Añadir Nuevo Nodo
          </span>
        </div>
      </div>
    </main>
  );
};
