import { useEffect, useState } from "react";
import { aiService } from "../../../../infrastructure/api/aiService";
import type { RiaStudentData } from "../RiaBentoGrid";

interface Props {
  student: RiaStudentData | null;
  studentId: string;
}

export const Ria10Card = ({ student, studentId }: Props) => {
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
      grade: student.grade,
      logical_level: student.logical_level,
    };
    aiService.recommendPedagogicalRia10(form)
      .then((apiResult) => setResult(apiResult as Record<string, unknown>))
      .catch((err) => setError(err instanceof Error ? err.message : "Error"))
      .finally(() => setLoading(false));
  }, [studentId, student]);

  const details = result?.details as Record<string, unknown> | undefined;
  const profile = details?.pedagogical_profile as string | undefined;
  const risk = details?.pedagogical_risk as string | undefined;
  const reasons = Array.isArray(details?.reasons) ? details.reasons as string[] : [];

  const getRiskBadge = (r: string) => {
    const m: Record<string, { label: string; cls: string }> = {
      low: { label: "Bajo", cls: "bg-green-500/10 text-green-500 border-green-500/20" },
      medium: { label: "Medio", cls: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
      high: { label: "Alto", cls: "bg-red-500/10 text-red-500 border-red-500/20" },
      critical: { label: "Crítico", cls: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
    };
    return m[r] ?? { label: r, cls: "bg-gray-500/10 text-gray-500 border-gray-500/20" };
  };
  const riskBadge = risk ? getRiskBadge(risk.toLowerCase()) : null;

  const metrics = [
    { label: "Recall", value: details?.recall as number },
    { label: "F1", value: details?.f1 as number },
    { label: "Precisión", value: result?.precision as number },
    { label: "Exactitud", value: result?.accuracy as number },
  ].filter((m) => typeof m.value === "number");

  return (
    <div className="h-full border border-border bg-surface rounded-xl p-5 flex flex-col transition-all duration-300 hover:shadow-lg" style={{ backgroundColor: "var(--surface)" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(var(--primary-rgb), 0.1)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>RIA10 · Pedagógico</span>
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
          <div className="flex items-center gap-4 flex-wrap">
            {profile && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/30" style={{ backgroundColor: "var(--bg)" }}>
                <span className="text-[9px] font-mono font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Perfil</span>
                <span className="text-[9px] font-mono font-bold" style={{ color: "var(--text)" }}>{profile}</span>
              </div>
            )}
            {riskBadge && (
              <span className={`text-[9px] font-mono font-bold px-3 py-1 rounded-full border ${riskBadge.cls}`}>{riskBadge.label}</span>
            )}
          </div>
          {metrics.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {metrics.map((m) => (
                <div key={m.label} className="text-center p-2 rounded-lg border border-border/30" style={{ backgroundColor: "var(--bg)" }}>
                  <div className="text-[9px] font-mono font-bold" style={{ color: "var(--text)" }}>{(m.value * 100).toFixed(0)}%</div>
                  <div className="text-[7px] font-mono uppercase" style={{ color: "var(--text-muted)" }}>{m.label}</div>
                </div>
              ))}
            </div>
          )}
          {reasons.length > 0 && (
            <div className="mt-auto space-y-1 pt-3 border-t border-border/30">
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
