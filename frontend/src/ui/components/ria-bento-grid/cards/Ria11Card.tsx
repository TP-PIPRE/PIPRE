import { useEffect, useState } from "react";
import { aiService } from "../../../../infrastructure/api/aiService";
import type { RiaStudentData } from "../RiaBentoGrid";

interface Props {
  student: RiaStudentData | null;
  studentId: string;
}

const getTimeBadge = (c: string) => {
  const m: Record<string, { label: string; cls: string }> = {
    fast: { label: "Rápido", cls: "bg-green-500/10 text-green-500 border-green-500/20" },
    normal: { label: "Normal", cls: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    slow: { label: "Lento", cls: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
    very_slow: { label: "Muy lento", cls: "bg-red-500/10 text-red-500 border-red-500/20" },
  };
  return m[c] ?? { label: c, cls: "bg-gray-500/10 text-gray-500 border-gray-500/20" };
};

export const Ria11Card = ({ student, studentId }: Props) => {
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
      ai_interactions: student.ai_interactions,
      inactive_days: student.inactive_days,
      help_requested: student.help_requested,
      completed_activities: student.completed_activities,
      age: student.age,
      grade: student.grade,
      logical_level: student.logical_level,
    };
    aiService.classifyTimeRia11(form)
      .then((apiResult) => setResult(apiResult as Record<string, unknown>))
      .catch((err) => setError(err instanceof Error ? err.message : "Error"))
      .finally(() => setLoading(false));
  }, [studentId, student]);

  const classification = typeof result?.classification === "string" ? result.classification.toLowerCase() : "";
  const badge = getTimeBadge(classification);
  const scores = result?.classification_scores as Record<string, number> | undefined;
  const scoreColors: Record<string, string> = { fast: "#22c55e", normal: "#3b82f6", slow: "#f59e0b", very_slow: "#ef4444" };

  return (
    <div className="h-full border border-border bg-surface rounded-xl p-5 flex flex-col transition-all duration-300 hover:shadow-lg" style={{ backgroundColor: "var(--surface)" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(var(--primary-rgb), 0.1)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>RIA11 · Tiempo</span>
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
          <span className={`text-[9px] font-mono font-bold px-3 py-1 rounded-full border ${badge.cls}`}>{badge.label}</span>
          {scores && (
            <div className="w-full space-y-1.5">
              <div className="w-full h-2 rounded-full overflow-hidden flex" style={{ backgroundColor: "var(--bg)" }}>
                {Object.entries(scores).map(([key, val]) => {
                  const total = Object.values(scores).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? (val / total) * 100 : 0;
                  if (pct <= 0) return null;
                  return <div key={key} style={{ width: `${pct}%`, backgroundColor: scoreColors[key] ?? "#6b7280", minWidth: 2 }} title={`${key}: ${(val * 100).toFixed(0)}%`} />;
                })}
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {Object.entries(scores).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: scoreColors[key] ?? "#6b7280" }} />
                    <span className="text-[7px] font-mono capitalize" style={{ color: "var(--text-muted)" }}>{key.replace("_", " ")}</span>
                    <span className="text-[7px] font-mono font-bold" style={{ color: "var(--text)" }}>{(val * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
