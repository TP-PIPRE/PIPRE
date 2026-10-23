import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { apiService } from "../../infrastructure/api/apiService";
import type {
  CourseResponseDTO,
  CreateActivityCommand,
  CourseRequestDTO,
  ModuleResponseDTO,
  LessonResponseDTO,
} from "../../infrastructure/api/models/apiModels";
import { getApiErrorMessage } from "../../infrastructure/api/errors";
import { Modal } from "../components/common/Modal";
import { Trash2 as BsTrashFill, Trash2 as BsTrash, ChevronDown as BsChevronDown, Terminal as BsTerminal, Pencil as BsPencil, Plus as BsPlusLg } from "lucide-react";

interface ChallengeView {
  idActivity: string;
  idLesson?: string;
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
  type: string;
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
  const [operationError, setOperationError] = useState("");
  const [saving, setSaving] = useState(false);

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
      level: "LOW",
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
      environment: "neonflow",
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
  const [pageSize, setPageSize] = useState(5);
  const [customPageSize, setCustomPageSize] = useState("");

  const PAGE_SIZE_OPTIONS = [5, 10, 15];

  const applyPageSize = (size: number) => {
    setPageSize(size);
    setChallengePage(0);
    setCustomPageSize("");
  };

  // Cargar cursos
  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.courses.getAll();
      if (data && data.length > 0) {
        setCourses(data);
      } else {
        setCourses([]);
      }
    } catch (err) {
      setOperationError(getApiErrorMessage(err, "No se pudieron cargar los cursos."));
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback: fetch activities as challenges via modules->lessons->activities
  // Si no hay módulos, intenta con simulations
  const fetchChallengesFromActivities = async (courseId: string): Promise<ChallengeView[]> => {
    try {
      const modules = await apiService.modules.getByCourse(courseId);
      if (modules.length === 0) {
        console.warn(`[RetosPage] Sin módulos para courseId=${courseId}`);
        return [];
      }
      const lessons = (await Promise.all(
        modules.map((mod) => apiService.lessons.getByModule(mod.idModule)),
      )).flat();
      if (lessons.length === 0) return [];
      const activities = (await Promise.all(
        lessons.map((lesson) => apiService.activities.getByLesson(lesson.idLesson)),
      )).flat();
      return activities.map((act, i) => ({
        idActivity: act.idActivity,
        courseId,
        title: act.name,
        idLesson: act.idLesson,
        complexity: act.complexity as ChallengeView["complexity"],
        logicLevel: act.logicLevel,
        type: act.type,
        simulatorConfig: { environment: act.environment || "neonflow", maxBlocks: 10, missions: act.missions || [], startingPosition: act.startingPosition, targetPosition: act.targetPosition },
        description: "",
        order: i,
        difficulty: (act.difficulty || "MEDIUM") as ChallengeView["difficulty"],
        points: 0,
      }));
    } catch (err) {
      console.warn(`[RetosPage] Error en fetchChallengesFromActivities para courseId=${courseId}:`, err);
      return [];
    }
  };

  // Cargar retos de un curso desde actividades
  const fetchChallengesByCourse = async (courseId: string) => {
    const challenges = await fetchChallengesFromActivities(courseId);
    setSelectedCourseChallenges(challenges);
    setChallengePage(0);
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
        setSelectedCourseChallenges([]);
        setIsChallengesModalOpen(true);
        fetchChallengesByCourse(course.idCourse);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, courses]);

  // Manejar envío de curso
  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setOperationError("");
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
      setOperationError(getApiErrorMessage(err, "No se pudo guardar el curso."));
    } finally { setSaving(false); }
  };

  // Validar formulario de reto
  const validateChallengeForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!challengeFormData.title?.trim()) errors.title = "El título es obligatorio";
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
      const newId = crypto.randomUUID();
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

  // Orden visual de esta sesión; el contrato no persiste un orden de actividad.
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
      setSelectedCourseChallenges([...sorted]);
    } catch (err) {
      console.error("Error reordering challenges:", err);
    }
  };

  // Cargar módulos de un curso
  const fetchModulesForCourse = async (courseId: string, lessonId?: string): Promise<string> => {
    const data = await apiService.modules.getByCourse(courseId);
    setModules(data); setSelectedModuleId(""); setSelectedLessonId(""); setLessons([]);
    const moduleLessons = await Promise.all(data.map(async m => ({ module: m, lessons: await apiService.lessons.getByModule(m.idModule) })));
    const selected = moduleLessons.find(m => m.lessons.some(l => l.idLesson === lessonId)) || moduleLessons.find(m => m.lessons.length);
    if (!selected) return "";
    const id = selected.lessons.some(l => l.idLesson === lessonId) ? lessonId! : selected.lessons[0].idLesson;
    setSelectedModuleId(selected.module.idModule); setLessons(selected.lessons); setSelectedLessonId(id);
    return id;
  };

  const handleChallengeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateChallengeForm() || !selectedCourse) return;
    setSaving(true); setOperationError("");
    try {
      const lessonId = selectedLessonId || await fetchModulesForCourse(selectedCourse.idCourse, selectedChallenge?.idLesson);
      if (!lessonId) { setOperationError("Este curso necesita un módulo y una lección antes de crear retos."); return; }
      const payload: CreateActivityCommand = {
        idLesson: lessonId, name: challengeFormData.title, complexity: challengeFormData.complexity,
        difficulty: challengeFormData.difficulty, logicLevel: challengeFormData.logicLevel, type: challengeFormData.type,
        environment: challengeFormData.simulatorConfig.environment, missions: challengeFormData.simulatorConfig.missions,
        startingPosition: challengeFormData.simulatorConfig.startingPosition, targetPosition: challengeFormData.simulatorConfig.targetPosition,
      };
      if (challengeModalType === "edit" && selectedChallenge) await apiService.activities.update(selectedChallenge.idActivity, payload);
      else await apiService.activities.create(payload); // 201 has an empty response body.
      setChallengeModalType(null); setFormErrors({});
      await fetchChallengesByCourse(selectedCourse.idCourse);
    } catch (error) { setOperationError(getApiErrorMessage(error, "No se pudo guardar el reto.")); }
    finally { setSaving(false); }
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
        setOperationError(getApiErrorMessage(err, "No se pudo eliminar el curso."));
        return;
      }
      setModalType(null);
    }
  };

  // Eliminar reto (activities API + soft delete via simulations)
  const handleDeleteChallenge = async (idActivity: string) => {
    try {
      const courseId = selectedCourse!.idCourse;
      await apiService.activities.delete(idActivity);
      fetchChallengesByCourse(courseId);
    } catch (err) {
      setOperationError(getApiErrorMessage(err, "No se pudo eliminar el reto."));
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center font-mono text-xs uppercase tracking-widest opacity-40 animate-pulse">
        Sincronizando Nodo...
      </div>
    );
  }

  return (
    <main className="flex-1 p-8 max-w-7xl mx-auto w-full animate-fade-in-soft">
      {operationError && <p role="alert" className="mb-4 border border-danger rounded-lg p-4 text-danger">{operationError}</p>}
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Gestión de <span className="text-primary">Retos</span>
          </h1>
          <p className="text-xs text-text-muted max-w-md font-medium">
            Organiza cursos, módulos y retos de aprendizaje.
          </p>
        </div>
        <button
          onClick={() => {
            setModalType("create");
            setFormData({ name: "", description: "", level: "LOW" });
          }}
          className="btn-premium px-8 py-3.5 text-xs tracking-[0.2em] font-black active:scale-95 transition-all shadow-xl hover:shadow-primary/10"
          style={{ borderRadius: "var(--theme-radius)" }}
        >
          Crear curso
        </button>
      </header>

      {/* Modal para Cursos */}
      <Modal
        title={modalType === "delete" ? "Eliminar curso" : modalType === "create" ? "Crear curso" : "Editar curso"}
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        maxWidth={modalType === "delete" ? "max-w-lg" : "max-w-2xl"}
      >
        <div className="flex flex-col">
          {modalType !== "delete" && (
            <div className="relative h-32 bg-primary/10 overflow-hidden flex items-center justify-center border-b border-border">
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
                <span className="text-xs font-black text-primary uppercase tracking-[0.4em] mb-2 block animate-fade-in-soft">
                  {modalType === "create"
                    ? "Crear curso"
                    : "Configuración del curso"}
                </span>
                <h2 className="text-2xl font-bold tracking-tight">
                  {modalType === "create"
                    ? "Nuevo curso"
                    : "Editar curso"}
                </h2>
              </div>
            </div>
          )}

          <div className="p-10">
            {operationError && <p role="alert" className="mb-4 text-sm text-danger">{operationError}</p>}
            {modalType === "delete" ? (
              <div className="text-center py-6">
                <div className="w-20 h-20 bg-danger/10 text-danger rounded-2xl flex items-center justify-center mx-auto mb-8 rotate-3 hover:rotate-0 transition-transform duration-500">
                  <BsTrashFill className="text-4xl" />
                </div>
                <h2 className="text-2xl font-bold mb-3">
                  ¿Confirmar Eliminación?
                </h2>
                <p className="text-sm text-text-muted mb-10 px-6 leading-relaxed">
                  Esta acción eliminará el curso{" "}
                  <span className="text-text font-bold">
                    "{selectedCourse?.name}"
                  </span>
                  . Esta operación es irreversible.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setModalType(null)}
                    className="flex-1 btn-secondary py-4 text-xs font-bold uppercase tracking-widest"
                  >
                    CANCELAR
                  </button>
                  <button
                    onClick={handleDeleteCourse}
                    className="flex-1 bg-danger text-white hover:brightness-110 py-4 text-xs font-bold uppercase tracking-widest shadow-xl shadow-danger/20 transition-all active:scale-95"
                    style={{ borderRadius: "var(--theme-radius)" }}
                  >
                    ELIMINAR CURSO
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCourseSubmit} aria-busy={saving} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="docenteretospage-field-1" className="text-xs uppercase tracking-widest text-text-muted font-black ml-1">
                      Nombre del curso
                    </label>
                    <input id="docenteretospage-field-1"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full bg-bg/50 border border-border px-6 py-4 text-sm focus:border-primary outline-none transition-all placeholder:opacity-30"
                      style={{ borderRadius: "var(--theme-radius)" }}
                      placeholder="Ej: Robótica Autónoma v2"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="course-complexity" className="text-xs uppercase tracking-widest text-text-muted font-black ml-1">
                      Nivel de Complejidad
                    </label>
                    <div className="relative">
                      <select id="course-complexity"
                        value={formData.level}
                        onChange={(e) =>
                          setFormData({ ...formData, level: e.target.value as CourseRequestDTO["level"] })
                        }
                        className="w-full bg-bg/50 border border-border px-6 py-4 text-sm focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                        style={{ borderRadius: "var(--theme-radius)" }}
                      >
                        <option value="LOW">
                          Básico (Fundamentos)
                        </option>
                        <option value="MEDIUM">
                          Intermedio (Control)
                        </option>
                        <option value="HIGH">
                          Avanzado (Sistemas)
                        </option>
                      </select>
                      <BsChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted" />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="docenteretospage-field-2" className="text-xs uppercase tracking-widest text-text-muted font-black ml-1">
                      Descripción Técnica
                    </label>
                    <textarea id="docenteretospage-field-2"
                      required
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full bg-bg/50 border border-border px-6 py-4 text-sm focus:border-primary outline-none transition-all min-h-[140px] placeholder:opacity-30 resize-none"
                      style={{ borderRadius: "var(--theme-radius)" }}
                      placeholder="Define los objetivos y alcances del curso..."
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="flex-1 btn-secondary py-5 text-xs font-black tracking-widest"
                  >
                    DESCARTAR
                  </button>
                  <button
                    type="submit" disabled={saving}
                    className="flex-[2] btn-premium py-5 text-xs font-black tracking-[0.3em] shadow-xl shadow-primary/20"
                  >
                    {modalType === "create"
                      ? "CREAR CURSO"
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
        title="Gestionar retos del curso"
        isOpen={isChallengesModalOpen}
        onClose={() => {
          setIsChallengesModalOpen(false);
          setChallengeModalType(null);
        }}
        maxWidth="max-w-4xl"
      >
        <div className="flex flex-col">
          {/* Header del modal (igual que antes) */}
          <div className="relative h-32 bg-primary/10 overflow-hidden flex items-center justify-center border-b border-border">
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
              <span className="text-xs font-black text-primary uppercase tracking-[0.4em] mb-2 block animate-fade-in-soft">
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
            {operationError && <p role="alert" className="mb-4 text-sm text-danger">{operationError}</p>}
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
                            environment: "neonflow",
                            maxBlocks: 10,
                            missions: [{ id: "m1", title: "Misión 1", objective: "", maxBlocks: 5 }],
                          },
                          expectedOutput: "",
                          reward: { type: "POINTS", value: 0 },
                        });
                        if (selectedCourse) void fetchModulesForCourse(selectedCourse.idCourse).catch(e => setOperationError(getApiErrorMessage(e, "No se pudieron cargar las lecciones.")));
                      }}
                      className="btn-premium px-4 py-2 text-xs font-bold uppercase tracking-widest"
                    >
                      + Nuevo Reto
                    </button>
                  </div>

                  {selectedCourseChallenges.length > 0 ? (
                    <>
                      <div className="space-y-4">
                        {[...selectedCourseChallenges]
                          .sort((a, b) => a.order - b.order)
                          .slice(challengePage * pageSize, (challengePage + 1) * pageSize)
                          .map((challenge) => (
                            <div
                              key={challenge.idActivity}
                              className="p-4 bg-bg/50 border border-border rounded-lg flex justify-between items-center"
                              style={{ borderRadius: "var(--theme-radius)" }}
                            >
                              <div>
                                <p className="font-semibold">{challenge.title}</p>
                                <p className="text-xs text-text-muted">
                                  {challenge.description}
                                </p>
                                <div className="flex gap-3 mt-1 text-xs text-text-muted">
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
                                    className="text-text-muted hover:text-primary text-xs leading-none"
                                    title="Subir en esta sesión" aria-label="Subir en esta sesión"
                                  >
                                    ▲
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveChallengeOrder(challenge.idActivity, "down")}
                                    className="text-text-muted hover:text-primary text-xs leading-none"
                                    title="Bajar en esta sesión" aria-label="Bajar en esta sesión"
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
                                        environment: (sim as any).environment || "tetrilogic",
                                        maxBlocks: (sim as any).maxBlocks || 10,
                                        missions: (sim as any).missions || [{ id: "m1", title: "Misión 1", objective: "", maxBlocks: 5 }],
                                        allowedHardware: (sim as any).allowedHardware || [],
                                        startingPosition: (sim as any).startingPosition || { x: 0, z: 0 },
                                        targetPosition: (sim as any).targetPosition || { x: 10, z: 10 },
                                      },
                                      expectedOutput: challenge.expectedOutput || "",
                                      reward: challenge.reward || { type: "POINTS", value: 0 },
                                    });
                                    if (selectedCourse) void fetchModulesForCourse(selectedCourse.idCourse, challenge.idLesson).catch(e => setOperationError(getApiErrorMessage(e, "No se pudieron cargar las lecciones.")));
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
                      {selectedCourseChallenges.length > pageSize && (
                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-text-muted">Ver</span>
                            {PAGE_SIZE_OPTIONS.map((size) => (
                              <button
                                key={size}
                                type="button"
                                onClick={() => applyPageSize(size)}
                                className={`px-2 py-0.5 text-xs font-bold font-mono border rounded transition-all ${
                                  pageSize === size && !customPageSize
                                    ? "border-primary text-primary bg-primary/10"
                                    : "border-border text-text-muted hover:border-primary"
                                }`}
                              >
                                {size}
                              </button>
                            ))}
                            {customPageSize ? (
                              <span className="px-2 py-0.5 text-xs font-bold font-mono border border-primary text-primary bg-primary/10 rounded">
                                {customPageSize}
                              </span>
                            ) : (
                              <input
                                type="number"
                                min="1"
                                max="999"
                                placeholder="—"
                                value={customPageSize}
                                onChange={(e) => setCustomPageSize(e.target.value)}
                                onBlur={() => {
                                  const n = parseInt(customPageSize, 10);
                                  if (n > 0 && n !== pageSize) {
                                    setPageSize(n);
                                    setChallengePage(0);
                                  } else {
                                    setCustomPageSize("");
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    const n = parseInt(customPageSize, 10);
                                    if (n > 0) {
                                      setPageSize(n);
                                      setChallengePage(0);
                                    } else {
                                      setCustomPageSize("");
                                    }
                                    (e.target as HTMLInputElement).blur();
                                  }
                                }}
                                className="w-10 px-1 py-0.5 text-xs font-mono text-center border border-border rounded bg-transparent outline-none focus:border-primary transition-all"
                              />
                            )}
                            <span className="text-xs text-text-muted ml-1">
                              por página
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-text-muted">
                              {challengePage * pageSize + 1}–{Math.min((challengePage + 1) * pageSize, selectedCourseChallenges.length)} de {selectedCourseChallenges.length}
                            </span>
                            <div className="flex gap-2">
                              <button
                                disabled={challengePage === 0}
                                onClick={() => setChallengePage(p => Math.max(0, p - 1))}
                                className="px-3 py-1 text-xs font-bold uppercase tracking-wider border border-border disabled:opacity-30 hover:border-primary transition-all rounded"
                              >
                                ← Anterior
                              </button>
                              <button
                                disabled={(challengePage + 1) * pageSize >= selectedCourseChallenges.length}
                                onClick={() => setChallengePage(p => p + 1)}
                                className="px-3 py-1 text-xs font-bold uppercase tracking-wider border border-border disabled:opacity-30 hover:border-primary transition-all rounded"
                              >
                                Siguiente →
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-center text-text-muted">
                      No hay retos disponibles para este curso. Crea uno nuevo.
                    </p>
                  )}
                </div>
              </>
            ) : (
              // ✅ Formulario integrado (sin fondo negro, mismo estilo que el modal)
              <form onSubmit={handleChallengeSubmit} aria-busy={saving} className="space-y-6">
                <p className="text-sm text-text-muted">Puedes guardar título, dificultad, nivel y misiones. Descripción, puntos y resultado esperado estarán disponibles más adelante. El orden de la lista sólo se conserva durante esta sesión.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="docenteretospage-field-3" className="text-xs uppercase tracking-widest text-text-muted font-black ml-1">
                      Módulo
                    </label>
                    <select id="docenteretospage-field-3"
                      value={selectedModuleId}
                      onChange={async (e) => {
                        setSelectedModuleId(e.target.value);
                        try {
                          const les = await apiService.lessons.getByModule(e.target.value);
                          setLessons(les);
                          if (les.length > 0) setSelectedLessonId(les[0].idLesson);
                        } catch { setLessons([]); }
                      }}
                      className="w-full bg-bg/50 border border-border px-4 py-2 text-sm focus:border-primary outline-none transition-all"
                      style={{ borderRadius: "var(--theme-radius)" }}
                    >
                      {modules.map((m) => (
                        <option key={m.idModule} value={m.idModule}>{m.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="docenteretospage-field-4" className="text-xs uppercase tracking-widest text-text-muted font-black ml-1">
                      Lección
                    </label>
                    <select id="docenteretospage-field-4"
                      value={selectedLessonId}
                      onChange={(e) => setSelectedLessonId(e.target.value)}
                      className="w-full bg-bg/50 border border-border px-4 py-2 text-sm focus:border-primary outline-none transition-all"
                      style={{ borderRadius: "var(--theme-radius)" }}
                    >
                      {lessons.map((l) => (
                        <option key={l.idLesson} value={l.idLesson}>{l.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="docenteretospage-field-5" className="text-xs uppercase tracking-widest text-text-muted font-black ml-1">
                      Título
                    </label>
                    <input id="docenteretospage-field-5"
                      required
                      value={challengeFormData.title || ""}
                      onChange={(e) =>
                        setChallengeFormData({
                          ...challengeFormData,
                          title: e.target.value,
                        })
                      }
                      className="w-full bg-bg/50 border border-border px-4 py-2 text-sm focus:border-primary outline-none transition-all"
                      style={{ borderRadius: "var(--theme-radius)" }}
                      placeholder="Ej: Mueve el robot 5 pasos"
                    />
                    {formErrors.title && <p className="text-danger text-xs mt-1">{formErrors.title}</p>}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="docenteretospage-field-6" className="text-xs uppercase tracking-widest text-text-muted font-black ml-1">
                      Orden
                    </label>
                    <input id="docenteretospage-field-6"
                      type="number"
                      required
                      min={1}
                      disabled title="Campo aún no disponible para guardar" value={challengeFormData.order || 0}
                      onChange={(e) =>
                        setChallengeFormData({
                          ...challengeFormData,
                          order: Number(e.target.value),
                        })
                      }
                      className="w-full bg-bg/50 border border-border px-4 py-2 text-sm focus:border-primary outline-none transition-all"
                      style={{ borderRadius: "var(--theme-radius)" }}
                      placeholder="Ej: 1"
                    />
                    {formErrors.order && <p className="text-danger text-xs mt-1">{formErrors.order}</p>}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="docenteretospage-field-7" className="text-xs uppercase tracking-widest text-text-muted font-black ml-1">
                      Dificultad
                    </label>
                    <select id="docenteretospage-field-7"
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
                      className="w-full bg-bg/50 border border-border px-4 py-2 text-sm focus:border-primary outline-none transition-all"
                      style={{ borderRadius: "var(--theme-radius)" }}
                    >
                      <option value="EASY">Fácil</option>
                      <option value="MEDIUM">Intermedio</option>
                      <option value="HARD">Avanzado</option>
                    </select>
                    {formErrors.difficulty && <p className="text-danger text-xs mt-1">{formErrors.difficulty}</p>}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="docenteretospage-field-8" className="text-xs uppercase tracking-widest text-text-muted font-black ml-1">
                      Puntos
                    </label>
                    <input id="docenteretospage-field-8"
                      type="number"
                      required
                      min={1}
                      disabled title="Campo aún no disponible para guardar" value={challengeFormData.points || 0}
                      onChange={(e) =>
                        setChallengeFormData({
                          ...challengeFormData,
                          points: Number(e.target.value),
                        })
                      }
                      className="w-full bg-bg/50 border border-border px-4 py-2 text-sm focus:border-primary outline-none transition-all"
                      style={{ borderRadius: "var(--theme-radius)" }}
                      placeholder="Ej: 50"
                    />
                    {formErrors.points && <p className="text-danger text-xs mt-1">{formErrors.points}</p>}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="docenteretospage-field-9" className="text-xs uppercase tracking-widest text-text-muted font-black ml-1">
                      Complejidad
                    </label>
                    <select id="docenteretospage-field-9"
                      value={challengeFormData.complexity || "MEDIUM"}
                      onChange={(e) =>
                        setChallengeFormData({
                          ...challengeFormData,
                          complexity: e.target.value as "LOW" | "MEDIUM" | "HIGH",
                        })
                      }
                      className="w-full bg-bg/50 border border-border px-4 py-2 text-sm focus:border-primary outline-none transition-all"
                      style={{ borderRadius: "var(--theme-radius)" }}
                    >
                      <option value="LOW">Baja</option>
                      <option value="MEDIUM">Media</option>
                      <option value="HIGH">Alta</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="docenteretospage-field-10" className="text-xs uppercase tracking-widest text-text-muted font-black ml-1">
                      Nivel Lógico
                    </label>
                    <input id="docenteretospage-field-10"
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
                      className="w-full bg-bg/50 border border-border px-4 py-2 text-sm focus:border-primary outline-none transition-all"
                      style={{ borderRadius: "var(--theme-radius)" }}
                      placeholder="Ej: 3"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="docenteretospage-field-11" className="text-xs uppercase tracking-widest text-text-muted font-black ml-1">
                      Descripción
                    </label>
                    <textarea id="docenteretospage-field-11"
                      required
                      disabled title="Campo aún no disponible para guardar" value={challengeFormData.description || ""}
                      onChange={(e) =>
                        setChallengeFormData({
                          ...challengeFormData,
                          description: e.target.value,
                        })
                      }
                      className="w-full bg-bg/50 border border-border px-4 py-2 text-sm focus:border-primary outline-none transition-all min-h-[100px] resize-none"
                      style={{ borderRadius: "var(--theme-radius)" }}
                      placeholder="Describe el objetivo del reto..."
                    />
                    {formErrors.description && <p className="text-danger text-xs mt-1">{formErrors.description}</p>}
                  </div>
                  <div className="space-y-4 md:col-span-2 border border-border p-4" style={{ borderRadius: "var(--theme-radius)" }}>
                    <div className="flex items-center justify-between">
                      <label className="text-xs uppercase tracking-widest text-text-muted font-black">
                        Configuración del Simulador
                      </label>
                      <span className="text-xs text-text-muted font-mono">Editor visual</span>
                    </div>

                    {/* Environment */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="docenteretospage-field-12" className="text-xs uppercase tracking-widest text-text-muted font-bold ml-1">Entorno</label>
                        <select id="docenteretospage-field-12"
                          value={challengeFormData.simulatorConfig?.environment || "tetrilogic"}
                          onChange={(e) =>
                            setChallengeFormData({
                              ...challengeFormData,
                              simulatorConfig: { ...challengeFormData.simulatorConfig, environment: e.target.value },
                            })
                          }
                          className="w-full bg-bg/50 border border-border px-4 py-2 text-sm focus:border-primary outline-none transition-all mt-1"
                          style={{ borderRadius: "var(--theme-radius)" }}
                        >
                          <option value="neonflow">Neon Flow (Lógica)</option>
                          <option value="tetrilogic">TetriLogic (Patrones)</option>
                        </select>
                        {formErrors.environment && <p className="text-danger text-xs mt-1">{formErrors.environment}</p>}
                      </div>

                      <div>
                        <label htmlFor="docenteretospage-field-13" className="text-xs uppercase tracking-widest text-text-muted font-bold ml-1">Límite de Bloques</label>
                        <input id="docenteretospage-field-13"
                          type="number"
                          min={1}
                          disabled title="El límite se guarda por misión" value={challengeFormData.simulatorConfig?.maxBlocks || 10}
                          onChange={(e) =>
                            setChallengeFormData({
                              ...challengeFormData,
                              simulatorConfig: { ...challengeFormData.simulatorConfig, maxBlocks: Number(e.target.value) },
                            })
                          }
                          className="w-full bg-bg/50 border border-border px-4 py-2 text-sm focus:border-primary outline-none transition-all mt-1"
                          style={{ borderRadius: "var(--theme-radius)" }}
                        />
                        {formErrors.maxBlocks && <p className="text-danger text-xs mt-1">{formErrors.maxBlocks}</p>}
                      </div>
                    </div>

                    {/* Misiones */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs uppercase tracking-widest text-text-muted font-bold ml-1">Misiones</label>
                        <button
                          type="button"
                          onClick={addMissionToConfig}
                          className="text-xs font-bold uppercase tracking-widest text-primary hover:underline"
                        >
                          + Agregar
                        </button>
                      </div>
                      {formErrors.missions && <p className="text-danger text-xs mb-2">{formErrors.missions}</p>}

                      {(challengeFormData.simulatorConfig?.missions || []).map((mission: any, _mi: number) => (
                        <div key={mission.id} className="flex gap-2 items-start mb-2 p-2 bg-bg/30 border border-border" style={{ borderRadius: "var(--theme-radius)" }}>
                          <div className="flex-1 space-y-1">
                            <input
                              aria-label="Título de la misión" placeholder="Título de la misión"
                              value={mission.title}
                              onChange={(e) => updateMissionInConfig(mission.id, "title", e.target.value)}
                              className="w-full bg-bg/50 border border-border px-2 py-1 text-xs focus:border-primary outline-none"
                              style={{ borderRadius: "var(--theme-radius)" }}
                            />
                            <input
                              aria-label="Objetivo de la misión" placeholder="Objetivo"
                              value={mission.objective}
                              onChange={(e) => updateMissionInConfig(mission.id, "objective", e.target.value)}
                              className="w-full bg-bg/50 border border-border px-2 py-1 text-xs focus:border-primary outline-none"
                              style={{ borderRadius: "var(--theme-radius)" }}
                            />
                          </div>
                          <div className="w-16">
                            <label htmlFor={`mission-blocks-${mission.id}`} className="text-xs text-text-muted block mb-0.5">Bloques</label>
                            <input id={`mission-blocks-${mission.id}`}
                              type="number"
                              min={1}
                              value={mission.maxBlocks}
                              onChange={(e) => updateMissionInConfig(mission.id, "maxBlocks", Number(e.target.value))}
                              className="w-full bg-bg/50 border border-border px-2 py-1 text-xs focus:border-primary outline-none"
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
                    <label htmlFor="docenteretospage-field-15" className="text-xs uppercase tracking-widest text-text-muted font-black ml-1">
                      Resultado Esperado
                    </label>
                    <input id="docenteretospage-field-15"
                      disabled title="Campo aún no disponible para guardar" value={challengeFormData.expectedOutput || ""}
                      onChange={(e) =>
                        setChallengeFormData({
                          ...challengeFormData,
                          expectedOutput: e.target.value,
                        })
                      }
                      className="w-full bg-bg/50 border border-border px-4 py-2 text-sm focus:border-primary outline-none transition-all"
                      style={{ borderRadius: "var(--theme-radius)" }}
                      placeholder="Ej: robot.llegarADestino()"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setChallengeModalType(null)}
                    className="flex-1 btn-secondary py-3 text-xs font-bold uppercase tracking-widest"
                  >
                    CANCELAR
                  </button>
                  <button
                    type="submit" disabled={saving}
                    className="flex-1 btn-premium py-3 text-xs font-bold uppercase tracking-widest"
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
            className="group relative bg-surface border border-border p-8 transition-all duration-700 hover:border-primary/30  hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden"
            style={{ borderRadius: "var(--theme-radius)" }}
          >
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div
                  className="w-14 h-14 flex items-center justify-center bg-bg/60 border border-border group-hover:border-primary/30 transition-all duration-500"
                  style={{ borderRadius: "var(--theme-radius)" }}
                >
                  <BsTerminal className="text-primary group-hover:text-primary  transition-all" />
                </div>
                <div className="flex gap-2">
                  <button aria-label={`Editar curso ${course.name}`}
                    onClick={() => {
                      setModalType("edit");
                      setSelectedCourse(course);
                      setFormData({
                        name: course.name,
                        description: course.description || "",
                        level: course.level || "LOW",
                      });
                    }}
                    className="w-11 h-11 flex items-center justify-center bg-bg/40 border border-border hover:border-primary/40 hover:text-primary transition-all active:scale-90"
                    style={{ borderRadius: "var(--theme-radius)" }}
                  >
                    <BsPencil className="text-base" />
                  </button>
                  <button aria-label={`Eliminar curso ${course.name}`}
                    onClick={() => {
                      setModalType("delete");
                      setSelectedCourse(course);
                    }}
                    className="w-11 h-11 flex items-center justify-center bg-bg/40 border border-border hover:border-danger/40 hover:text-danger transition-all active:scale-90"
                    style={{ borderRadius: "var(--theme-radius)" }}
                  >
                    <BsTrash className="text-base" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold mb-3 group-hover:text-primary transition-colors">
                {course.name}
              </h3>

              <div className="flex items-center gap-5 text-xs font-mono uppercase tracking-[0.15em] text-text-muted mb-8">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-success/60 rounded-full group-hover:bg-success group-hover:animate-pulse transition-colors" />
                  Online
                </span>
                <span>Node: {(course.idCourse || "").split("-")[0]}</span>
              </div>

              <div className="flex gap-4 pt-6 border-t border-border">
                <button
                  onClick={() => {
                    setChallengePage(0);
                    setSelectedCourse(course);
                    setSelectedCourseChallenges([]);
                    fetchChallengesByCourse(course.idCourse);
                    setIsChallengesModalOpen(true);
                  }}
                  className="flex-1 text-xs font-black uppercase tracking-widest py-3 bg-bg/60 border border-border hover:border-primary/30 hover:bg-primary/5 transition-all active:scale-95"
                  style={{ borderRadius: "var(--theme-radius)" }}
                >
                  Retos
                </button>
                <button onClick={() => { setSelectedCourse(course); setFormData({ name: course.name, description: course.description || "", level: course.level || "LOW" }); setModalType("edit"); }}
                  className="flex-1 text-xs font-black uppercase tracking-widest py-3 border border-border hover:border-primary/30 transition-all active:scale-95"
                  style={{ borderRadius: "var(--theme-radius)" }}
                >
                  Detalles
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* CARD DE AGREGAR RÁPIDO */}
        <button type="button"
          onClick={() => {
            setModalType("create");
            setFormData({ name: "", description: "", level: "LOW" });
          }}
          className="border-2 border-dashed border-border p-8 flex flex-col items-center justify-center gap-5 text-text-muted hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all cursor-pointer group"
          style={{ borderRadius: "var(--theme-radius)" }}
        >
          <div className="w-16 h-16 rounded-full border border-dashed border-border flex items-center justify-center  group-hover:border-primary/30 transition-all duration-500">
            <BsPlusLg className="text-4xl" />
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.3em] opacity-60 group-hover:opacity-100 transition-opacity">
            Añadir curso
          </span>
        </button>
      </div>
    </main>
  );
};
