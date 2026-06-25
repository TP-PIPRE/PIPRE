import { useEffect, useState } from "react";
import { aiService } from "../../../../infrastructure/api/aiService";
import type { RiaStudentData } from "../RiaBentoGrid";

interface Props {
  student: RiaStudentData | null;
  studentId: string;
}

export const Ria01Card = ({ student, studentId }: Props) => {
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
      logical_level: student.logical_level,
      ai_interactions: student.ai_interactions,
    };
    aiService.predictRia01(form)
      .then((apiResult) => {
        const scoreMap: Record<string, number> = { low: 30, medium: 60, high: 90 };
        const pred = typeof apiResult.result === "string" ? apiResult.result.toLowerCase() : "";
        setResult({
          ...apiResult,
          ...student,
          score: scoreMap[pred] ?? 50,
          success_rate: student.success_rate,
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error"))
      .finally(() => setLoading(false));
  }, [studentId, student]);

  const r = result ?? {};
  const scoreMap: Record<string, number> = { low: 30, medium: 60, high: 90 };
  const rawScore = typeof r.score === "number" ? r.score : typeof r.result === "string" ? scoreMap[r.result.toLowerCase()] ?? 50 : 50;

  return (
    <div className="h-full border border-border bg-surface rounded-xl p-5 flex flex-col transition-all duration-300 hover:shadow-lg" style={{ backgroundColor: "var(--surface)" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(var(--primary-rgb), 0.1)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>RIA01 · Desempeño</span>
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
            <span className="text-3xl font-mono font-bold" style={{ color: rawScore > 75 ? "var(--primary)" : rawScore > 40 ? "#f59e0b" : "#ef4444" }}>{rawScore}%</span>
            <span className={`text-[9px] font-mono font-bold px-3 py-1 rounded-full border ${rawScore > 75 ? "bg-green-500/10 text-green-500 border-green-500/20" : rawScore > 40 ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}`}>
              {rawScore > 75 ? "Alto" : rawScore > 40 ? "Medio" : "Bajo"}
            </span>
          </div>
          <div className="w-full space-y-1 pt-3 border-t border-border/30">
            <div className="flex justify-between text-[8px] font-mono" style={{ color: "var(--text-muted)" }}>
              <span>Precisión</span>
              <span className="font-bold" style={{ color: "var(--text)" }}>{typeof r.precision === "number" ? `${(r.precision * 100).toFixed(0)}%` : "-"}</span>
            </div>
            <div className="flex justify-between text-[8px] font-mono" style={{ color: "var(--text-muted)" }}>
              <span>Exactitud</span>
              <span className="font-bold" style={{ color: "var(--text)" }}>{typeof r.accuracy === "number" ? `${(r.accuracy * 100).toFixed(0)}%` : "-"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
