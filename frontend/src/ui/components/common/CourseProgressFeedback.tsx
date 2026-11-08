export function CourseProgressFeedback({ pending, error, reload }: { pending: boolean; error?: string; reload: () => void }) {
  if (pending) return <p role="status" className="p-3 text-sm text-text-muted">Consultando progreso…</p>;
  if (!error) return null;
  return <div className="flex flex-wrap items-center gap-3 p-3">
    <p role="alert" className="text-sm text-danger">No pudimos verificar tu progreso. {error}</p>
    <button type="button" className="btn-secondary" onClick={reload}>Reintentar progreso</button>
  </div>;
}
