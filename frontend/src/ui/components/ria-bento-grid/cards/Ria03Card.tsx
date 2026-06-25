import { useEffect, useState } from "react";
import { aiService } from "../../../../infrastructure/api/aiService";
import type { RiaStudentData } from "../RiaBentoGrid";

interface Props {
  student: RiaStudentData | null;
  studentId: string;
}

export const Ria03Card = ({ student, studentId }: Props) => {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!student || !studentId) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const form = {
      logical_level: student.logical_level,
      inactive_days: student.inactive_days,
      ai_interactions: student.ai_interactions,
      attempts: student.attempts,
    };
    aiService.recommendRia03(form)
      .then((apiResult) => setResult(apiResult as Record<string, unknown>))
      .catch((err) => setError(err instanceof Error ? err.message : "Error"))
      .finally(() => setLoading(false));
  }, [studentId, student]);

  const scoreMap: Record<string, number> = { low: 30, medium: 60, high: 90 };
  const colorMap: Record<string, string> = { low: "#ef4444", medium: "#f59e0b", high: "var(--primary)" };
  const getBadge = (level: string) => {
    const m: Record<string, { label: string; cls: string }> = {
      low: { label: "Básico", cls: "bg-red-500/10 text-red-500 border-red-500/20" },
      medium: { label: "Intermedio", cls: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
      high: { label: "Avanzado", cls: "bg-green-500/10 text-green-500 border-green-500/20" },
    };
    return m[level] ?? { label: level, cls: "bg-gray-500/10 text-gray-500 border-gray-500/20" };
  };

  const resultLevel = typeof result?.result === "string" ? result.result.toLowerCase() : "";
  const badge = getBadge(resultLevel);
  const rawScore = scoreMap[resultLevel] ?? 50;
  const scoreColor = colorMap[resultLevel] ?? "var(--text-muted)";
  const reasons = Array.isArray(result?.reasons) ? result.reasons as string[] : [];
  const activities = Array.isArray(result?.activities) ? result.activities as string[] : [];

  return (
    <div className="h-full border border-border bg-surface rounded-xl p-5 flex flex-col transition-all duration-300 hover:shadow-lg" style={{ backgroundColor: "var(--surface)" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(var(--primary-rgb), 0.1)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>RIA03 · Recomendación</span>
      </div>

      {!studentId ? (
        <div className="flex-1 flex items-center justify-center text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
          Selecciona un estudiante
        </div>
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
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <span className="text-3xl font-mono font-bold" style={{ color: scoreColor }}>{rawScore}%</span>
            <span className={`text-[9px] font-mono font-bold px-3 py-1 rounded-full border ${badge.cls}`}>{badge.label}</span>
            {reasons.length > 0 && (
              <div className="w-full space-y-0.5 pt-2">
                {reasons.slice(0, 2).map((r, i) => (
                  <div key={i} className="text-[8px] font-mono flex gap-1.5" style={{ color: "var(--text)" }}>
                    <span style={{ color: "var(--primary)" }}>▸</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="w-full space-y-1 pt-3 border-t border-border/30">
            <div className="flex justify-between text-[8px] font-mono" style={{ color: "var(--text-muted)" }}>
              <span>Precisión</span>
              <span className="font-bold" style={{ color: "var(--text)" }}>{typeof result.accuracy === "number" ? `${(result.accuracy * 100).toFixed(0)}%` : "-"}</span>
            </div>
            {activities.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {activities.map((a, i) => (
                  <span key={i} className="text-[7px] font-mono px-1.5 py-0.5 rounded border border-border/30" style={{ backgroundColor: "var(--bg)" }}>{a}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
