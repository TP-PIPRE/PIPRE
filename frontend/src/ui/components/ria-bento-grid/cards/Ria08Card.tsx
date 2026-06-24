import { useEffect, useState } from "react";
import { aiService } from "../../../../infrastructure/api/aiService";
import type { RiaStudentData } from "../RiaBentoGrid";

interface Props {
  student: RiaStudentData | null;
  studentId: string;
}

export const Ria08Card = ({ student, studentId }: Props) => {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!student || !studentId) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const form = {
      attempts: student.attempts,
      errors: student.errors,
      score: student.score,
      inactive_days: student.inactive_days,
    };
    aiService.detectAnomalyRia08(form)
      .then((apiResult) => setResult(apiResult as Record<string, unknown>))
      .catch((err) => setError(err instanceof Error ? err.message : "Error"))
      .finally(() => setLoading(false));
  }, [studentId, student]);

  const isAnomaly = result?.anomaly === true;
  const reasons = Array.isArray(result?.reasons) ? result.reasons as string[] : [];

  return (
    <div className="h-full border border-border bg-surface rounded-xl p-5 flex flex-col transition-all duration-300 hover:shadow-lg" style={{ backgroundColor: "var(--surface)" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(var(--primary-rgb), 0.1)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>RIA08 · Anomalías</span>
      </div>

      {!studentId ? (
        <div className="flex-1 flex items-center justify-center text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>Selecciona un estudiante</div>
      ) : loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-[9px] font-mono" style={{ color: "var(--text-muted)" }}>Analizando...</span>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-[10px] font-mono text-red-500 text-center px-2">{error}</div>
      ) : !result ? (
        <div className="flex-1 flex items-center justify-center text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>Sin datos</div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${isAnomaly ? "border-red-500 bg-red-500/10" : "border-green-500 bg-green-500/10"}`}>
            {isAnomaly ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            )}
          </div>
          <span className={`text-[10px] font-mono font-bold ${isAnomaly ? "text-red-500" : "text-green-500"}`}>
            {isAnomaly ? "Anomalía detectada" : "Sin anomalías"}
          </span>
          {reasons.length > 0 && (
            <div className="mt-auto w-full space-y-1 pt-3 border-t border-border/30">
              <span className="text-[8px] font-mono font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Razones</span>
              {reasons.map((r, i) => (
                <div key={i} className="text-[8px] font-mono flex gap-1.5" style={{ color: "var(--text)" }}>
                  <span style={{ color: "var(--primary)" }}>▸</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
