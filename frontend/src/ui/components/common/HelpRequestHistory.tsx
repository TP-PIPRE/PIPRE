import { useEffect, useState } from "react";
import { apiService } from "../../../infrastructure/api/apiService";
import type { HelpRequestDTO } from "../../../infrastructure/api/models/apiModels";

export function HelpRequestHistory({ students }: { students: Array<{ idStudent: string; studentName: string }> }) {
  const [history, setHistory] = useState<Array<HelpRequestDTO & { studentName: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(0);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    async function load() {
      const rows: Array<HelpRequestDTO & { studentName: string }> = [];
      let errors = 0;
      for (let offset = 0; offset < students.length; offset += 5) {
        const batch = await Promise.allSettled(students.slice(offset, offset + 5).map(async student => {
          const requests = await apiService.analytics.getHelpRequests(student.idStudent);
          return requests.map(r => ({ ...r, studentName: student.studentName }));
        }));
        batch.forEach(result => { if (result.status === "fulfilled") rows.push(...result.value); else errors++; });
      }
      if (active) { setHistory(rows.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))); setFailed(errors); setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [students, revision]);
  return <section aria-label="Historial de ayudas" className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Historial de ayudas</h2><button disabled={loading} className="btn-secondary" onClick={() => { setLoading(true); setRevision(r => r + 1); }}>Actualizar ayudas</button></div>
    {loading ? <p role="status" className="text-sm text-text-muted">Cargando ayudas registradas…</p> : <>
      {failed > 0 && <p role="alert" className="text-sm text-danger">No se pudieron consultar las ayudas de {failed} estudiantes. Actualiza para reintentar.</p>}
      {history.length ? <ul className="max-h-[600px] space-y-3 overflow-y-auto">{history.map(request => <li key={request.idHelpRequest} className="rounded-lg border border-border bg-surface p-4">
        <p className="font-semibold">{request.studentName}</p><p className="mt-1 text-sm text-text-muted">{request.aiInteractions} interacciones con el asistente</p><time dateTime={request.requestedAt} className="mt-2 block text-xs text-text-muted">{new Date(request.requestedAt).toLocaleString("es-CO")}</time>
      </li>)}</ul> : <p className="rounded-lg border border-border p-5 text-sm text-text-muted">{failed ? "No hay registros disponibles en las consultas completadas." : "Todavía no hay ayudas registradas para tus estudiantes."}</p>}
    </>}
  </section>;
}
