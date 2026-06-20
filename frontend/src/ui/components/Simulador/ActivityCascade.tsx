/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { apiService } from "../../../infrastructure/api/apiService";
import type { ActivityResponse } from "../../../shared/types/SpecContracts";

interface CascadeOption {
  id: string;
  label: string;
}

interface ActivityCascadeProps {
  selectedActivityId: string | null;
  onSelect: (activity: ActivityResponse) => void;
}

export const ActivityCascade = ({
  selectedActivityId,
  onSelect,
}: ActivityCascadeProps) => {
  const [courses, setCourses] = useState<CascadeOption[]>([]);
  const [modules, setModules] = useState<CascadeOption[]>([]);
  const [lessons, setLessons] = useState<CascadeOption[]>([]);
  const [activities, setActivities] = useState<ActivityResponse[]>([]);

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");

  const [loading, setLoading] = useState({
    courses: false,
    modules: false,
    lessons: false,
    activities: false,
  });

  useEffect(() => {
    setLoading((p) => ({ ...p, courses: true }));
    apiService.courses
      .getAll()
      .then((data) =>
        setCourses(data.map((c) => ({ id: c.idCourse, label: c.name }))),
      )
      .catch(() => {})
      .finally(() => setLoading((p) => ({ ...p, courses: false })));
  }, []);

  useEffect(() => {
    setSelectedModuleId("");
    setSelectedLessonId("");
    setActivities([]);
    if (!selectedCourseId) {
      setModules([]);
      return;
    }
    setLoading((p) => ({ ...p, modules: true }));
    apiService.modules
      .getByCourse(selectedCourseId)
      .then((data) =>
        setModules(data.map((m) => ({ id: m.idModule, label: m.title }))),
      )
      .catch(() => setModules([]))
      .finally(() => setLoading((p) => ({ ...p, modules: false })));
  }, [selectedCourseId]);

  useEffect(() => {
    setSelectedLessonId("");
    setActivities([]);
    if (!selectedModuleId) {
      setLessons([]);
      return;
    }
    setLoading((p) => ({ ...p, lessons: true }));
    apiService.lessons
      .getByModule(selectedModuleId)
      .then((data) =>
        setLessons(data.map((l) => ({ id: l.idLesson, label: l.title }))),
      )
      .catch(() => setLessons([]))
      .finally(() => setLoading((p) => ({ ...p, lessons: false })));
  }, [selectedModuleId]);

  useEffect(() => {
    if (!selectedLessonId) {
      setActivities([]);
      return;
    }
    setLoading((p) => ({ ...p, activities: true }));
    apiService.activities
      .getByLesson(selectedLessonId)
      .then((data) => setActivities(data))
      .catch(() => setActivities([]))
      .finally(() => setLoading((p) => ({ ...p, activities: false })));
  }, [selectedLessonId]);

  return (
    <div className="flex flex-col gap-3">
      {/* Course */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase font-bold tracking-widest text-text-muted">
          Curso
        </label>
        <select
          className="w-full p-2.5 bg-bg border border-border text-sm text-text focus:outline-none focus:border-primary transition-colors"
          style={{ borderRadius: "var(--theme-radius)" }}
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
        >
          <option value="">{loading.courses ? "Cargando..." : "Seleccionar curso..."}</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Module */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase font-bold tracking-widest text-text-muted">
          Módulo
        </label>
        <select
          className="w-full p-2.5 bg-bg border border-border text-sm text-text focus:outline-none focus:border-primary transition-colors disabled:opacity-40"
          style={{ borderRadius: "var(--theme-radius)" }}
          value={selectedModuleId}
          disabled={!selectedCourseId}
          onChange={(e) => setSelectedModuleId(e.target.value)}
        >
          <option value="">{loading.modules ? "Cargando..." : "Seleccionar módulo..."}</option>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* Lesson */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase font-bold tracking-widest text-text-muted">
          Lección
        </label>
        <select
          className="w-full p-2.5 bg-bg border border-border text-sm text-text focus:outline-none focus:border-primary transition-colors disabled:opacity-40"
          style={{ borderRadius: "var(--theme-radius)" }}
          value={selectedLessonId}
          disabled={!selectedModuleId}
          onChange={(e) => setSelectedLessonId(e.target.value)}
        >
          <option value="">{loading.lessons ? "Cargando..." : "Seleccionar lección..."}</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>{l.label}</option>
          ))}
        </select>
      </div>

      {/* Activities */}
      <div className="flex flex-col gap-1">
        <h3 className="text-[10px] uppercase font-bold tracking-widest text-text-muted mb-1">
          Actividades
        </h3>
        {loading.activities ? (
          <p className="text-xs text-text-muted animate-pulse">Cargando actividades...</p>
        ) : activities.length === 0 ? (
          <p className="text-xs text-text-muted italic">No hay actividades para esta lección.</p>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
            {activities.map((a) => {
              const isSelected = a.idActivity === selectedActivityId;
              return (
                <button
                  key={a.idActivity}
                  onClick={() => onSelect(a)}
                  className={`w-full text-left p-2.5 border text-sm transition-all duration-200 ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-bg text-text hover:border-primary/40"
                  }`}
                  style={{ borderRadius: "var(--theme-radius)" }}
                >
                  <div className="font-semibold">{a.name}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};