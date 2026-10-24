import { useEffect, useState } from "react";
import { apiService } from "../../../infrastructure/api/apiService";
import { getApiErrorMessage } from "../../../infrastructure/api/errors";
import type { LessonResponseDTO, ModuleResponseDTO } from "../../../infrastructure/api/models/apiModels";

type ModuleTree = ModuleResponseDTO & { lessons: LessonResponseDTO[] };
async function loadTree(courseId: string): Promise<ModuleTree[]> {
  const modules = await apiService.modules.getByCourse(courseId);
  return Promise.all(modules.map(async m => ({ ...m, lessons: await apiService.lessons.getByModule(m.idModule) })));
}

export function CourseStructure({ courseId }: { courseId: string }) {
  const [tree, setTree] = useState<ModuleTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [moduleTitle, setModuleTitle] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [expanded, setExpanded] = useState(true);
  useEffect(() => {
    let active = true;
    loadTree(courseId).then(data => {
      if (active) { setTree(data); setModuleId(data[0]?.idModule ?? ""); }
    }).catch(e => { if (active) setError(getApiErrorMessage(e, "No se pudo cargar la estructura.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [courseId]);

  async function create(kind: "module" | "lesson", event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      if (kind === "module") await apiService.modules.create({ idCourse: courseId, title: moduleTitle.trim() });
      else await apiService.lessons.create({ idModule: moduleId, title: lessonTitle.trim() });
      // Both endpoints return an empty 201; re-read the generated IDs.
      const updated = await loadTree(courseId);
      if (kind === "module") {
        const created = updated.find(m => !tree.some(previous => previous.idModule === m.idModule));
        setModuleId(created?.idModule ?? moduleId); setModuleTitle("");
      } else setLessonTitle("");
      setTree(updated); setNotice(kind === "module" ? "Módulo creado. Ahora puedes añadir sus lecciones." : "Lección creada. Ya puedes asociarle un reto.");
    } catch (e) { setError(getApiErrorMessage(e, "No se pudo guardar. Conservamos los datos para reintentar.")); }
    finally { setBusy(false); }
  }
  return <details className="mb-6 rounded-lg border border-border p-4" open={expanded} onToggle={event => setExpanded(event.currentTarget.open)}>
    <summary className="cursor-pointer font-semibold">Módulos y lecciones del curso</summary>
    {loading ? <p role="status" className="mt-3 text-sm text-text-muted">Cargando estructura…</p> : <div className="mt-4 space-y-4">
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <p role="status" className="text-sm text-success">{notice}</p>
      {tree.length > 0 ? <ul className="space-y-2 text-sm">{tree.map(m => <li key={m.idModule}><strong>{m.title}</strong><span className="text-text-muted"> · {m.lessons.map(l => l.title).join(", ") || "Sin lecciones"}</span></li>)}</ul> : <p className="text-sm text-text-muted">Crea el primer módulo y una lección para organizar los retos.</p>}
      <div className="grid gap-4 md:grid-cols-2" aria-busy={busy}>
        <form onSubmit={e => void create("module", e)} className="space-y-2">
          <label htmlFor="new-module" className="block text-sm font-semibold">Nuevo módulo</label>
          <input id="new-module" required maxLength={255} value={moduleTitle} onChange={e => setModuleTitle(e.target.value)} className="w-full rounded-lg border border-border bg-bg p-3" />
          <button disabled={busy || !moduleTitle.trim()} className="btn-secondary">Crear módulo</button>
        </form>
        <form onSubmit={e => void create("lesson", e)} className="space-y-2">
          <label htmlFor="lesson-module" className="block text-sm font-semibold">Módulo de la nueva lección</label>
          <select id="lesson-module" required disabled={!tree.length || busy} value={moduleId} onChange={e => setModuleId(e.target.value)} className="w-full rounded-lg border border-border bg-bg p-3">
            <option value="" disabled>Selecciona un módulo</option>{tree.map(m => <option key={m.idModule} value={m.idModule}>{m.title}</option>)}
          </select>
          <label htmlFor="new-lesson" className="block text-sm font-semibold">Nueva lección</label>
          <input id="new-lesson" required maxLength={255} disabled={!tree.length} value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} className="w-full rounded-lg border border-border bg-bg p-3" />
          <button disabled={busy || !moduleId || !lessonTitle.trim()} className="btn-secondary">Crear lección</button>
        </form>
      </div>
    </div>}
  </details>;
}
