import { useEffect, useState } from "react";
import { aiService } from "../../../../infrastructure/api/aiService";
import type { RiaStudentData } from "../RiaBentoGrid";

interface Props {
  student: RiaStudentData | null;
  studentId: string;
}

export const Ria04Card = ({ student, studentId }: Props) => {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!student || !studentId) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const form = {
      score: student.score,
      success_rate: student.success_rate,
      errors: student.errors,
      attempts: student.attempts,
      help_requested: student.help_requested,
      completed_activities: student.completed_activities,
      inactive_days: student.inactive_days,
      logical_level: student.logical_level,
    };
    aiService.adjustDifficultyRia04(form)
      .then((apiResult) => setResult(apiResult as Record<string, unknown>))
      .catch((err) => setError(err instanceof Error ? err.message : "Error"))
      .finally(() => setLoading(false));
  }, [studentId, student]);

  const getDifficultyMeter = (level: string): { fill: string; pct: number; label: string } => {
    switch (level) {
      case "low": return { fill: "#22c55e", pct: 25, label: "Baja" };
      case "medium": return { fill: "#f59e0b", pct: 55, label: "Media" };
      case "high": return { fill: "#ef4444", pct: 85, label: "Alta" };
      default: return { fill: "#6b7280", pct: 50, label: level };
    }
  };

  const diff = typeof result?.difficulty_level === "string" ? getDifficultyMeter(result.difficulty_level.toLowerCase()) : null;
  const rec = typeof result?.recommendation === "string" ? result.recommendation : "";
  const reasons = Array.isArray(result?.reasons) ? result.reasons as string[] : [];

  return (
    <div className="h-full border border-border bg-surface rounded-xl p-5 flex flex-col transition-all duration-300 hover:shadow-lg" style={{ backgroundColor: "var(--surface)" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(var(--primary-rgb), 0.1)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>RIA04 · Dificultad</span>
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
        <div className="flex-1 flex flex-col gap-4">
          {diff && (
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${diff.pct}%`, backgroundColor: diff.fill }} />
              </div>
              <span className="text-xs font-mono font-bold" style={{ color: diff.fill }}>{diff.label}</span>
            </div>
          )}
          {rec && (
            <div className="p-3 rounded-lg border border-border/30 text-[9px] font-mono leading-relaxed" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
              {rec}
            </div>
          )}
          {reasons.length > 0 && (
            <div className="mt-auto space-y-1 pt-3 border-t border-border/30">
              <span className="text-[8px] font-mono font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Razones</span>
              {reasons.map((r, i) => (
                <div key={i} className="text-[9px] font-mono flex gap-1.5" style={{ color: "var(--text)" }}>
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
