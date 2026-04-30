import React, { useEffect, useState } from "react";
import { apiService } from "../../infrastructure/api/apiService";
import type { CourseResponseDTO } from "../../infrastructure/api/models/apiModels";
import { Modal } from "../components/common/Modal";

const MOCK_COURSES = [
  {
    id_course: "1",
    name: "Robótica Nivel 1: Fundamentos (Local)",
    level: "Básico",
  },
  {
    id_course: "2",
    name: "Programación de Microcontroladores (Local)",
    level: "Intermedio",
  },
  {
    id_course: "3",
    name: "Diseño y Mecánica de Robots (Local)",
    level: "Avanzado",
  },
];

export const DocenteRetosPage: React.FC = () => {
  const [courses, setCourses] = useState<CourseResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalType, setModalType] = useState<
    "create" | "edit" | "delete" | null
  >(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    level: "BASIC",
  });

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.courses.getAll();
      if (data && data.length > 0) {
        setCourses(data);
      } else {
        setCourses(MOCK_COURSES as any);
      }
    } catch (err) {
      console.error("Error fetching courses, using fallback:", err);
      setCourses(MOCK_COURSES as any);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalType === "create") {
        await apiService.courses.create(formData);
      } else if (modalType === "edit" && selectedCourse) {
        await apiService.courses.update({
          ...formData,
          id_course: selectedCourse.id_course,
        });
      }
      setModalType(null);
      fetchCourses();
    } catch (err) {
      console.error("Error saving course:", err);
    }
  };

  const handleDelete = async () => {
    if (selectedCourse) {
      try {
        await apiService.courses.delete(selectedCourse.id_course);
        setCourses((prev) =>
          prev.filter((c) => c.id_course !== selectedCourse.id_course),
        );
      } catch (err) {
        console.error("Error deleting course:", err);
      }
      setModalType(null);
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

      {/* MODAL — uses shared component */}
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
                    onClick={handleDelete}
                    className="flex-1 bg-danger text-white hover:brightness-110 py-4 text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-danger/20 transition-all active:scale-95"
                    style={{ borderRadius: "var(--theme-radius)" }}
                  >
                    ELIMINAR NODO
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
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

      {/* LISTADO DE CURSOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map((course) => (
          <div
            key={course.id_course}
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
                        description: "Módulo industrial.",
                        level: "BASIC",
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
                <span>Node: {course.id_course.split("-")[0]}</span>
              </div>

              <div className="flex gap-4 pt-6 border-t border-border/10">
                <button
                  className="flex-1 text-[10px] font-black uppercase tracking-widest py-3 bg-bg/60 border border-border/10 hover:border-primary/30 hover:bg-primary/5 transition-all active:scale-95"
                  style={{ borderRadius: "var(--theme-radius)" }}
                >
                  Módulos
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
