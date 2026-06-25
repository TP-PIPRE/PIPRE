import { useEffect, useState } from "react";
import { aiService } from "../../../infrastructure/api/aiService";
import { Ria01Card } from "./cards/Ria01Card";
import { Ria03Card } from "./cards/Ria03Card";
import { Ria04Card } from "./cards/Ria04Card";
import { Ria08Card } from "./cards/Ria08Card";
import { Ria10Card } from "./cards/Ria10Card";
import { Ria11Card } from "./cards/Ria11Card";

export interface RiaStudentData {
  id: string;
  name: string;
  attempts: number;
  errors: number;
  logical_level: string;
  ai_interactions: number;
  inactive_days: number;
  score: number;
  success_rate: number;
  help_requested: number;
  completed_activities: number;
  age: number;
  grade: number;
  rankingPosition: number;
}

interface Props {
  student: RiaStudentData | null;
  studentId: string;
}

export const RiaBentoGrid = ({ student, studentId }: Props) => {
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    aiService.health()
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  const isHealthy = health?.status === "healthy" || health?.status === "ok";

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-mono font-bold tracking-tight mb-1" style={{ color: "var(--text)" }}>
            Dashboard de Resultados IA
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Análisis multidimensional de desempeño del estudiante
          </p>
        </div>
        <div className="flex items-center gap-3 border border-border bg-surface rounded-xl px-4 py-3 shrink-0" style={{ backgroundColor: "var(--surface)" }}>
          <div className={`w-3 h-3 rounded-full ${isHealthy ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>API de IA</span>
          <span className="text-xs font-mono font-bold" style={{ color: isHealthy ? "#22c55e" : "#ef4444" }}>
            {isHealthy ? "● Operativo" : "● No disponible"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 auto-rows-min">
        <div style={{ gridRow: "span 2" }}>
          <Ria01Card student={student} studentId={studentId} />
        </div>
        <div style={{ gridRow: "span 2" }}>
          <Ria03Card student={student} studentId={studentId} />
        </div>
        <div style={{ gridRow: "span 2" }}>
          <Ria08Card student={student} studentId={studentId} />
        </div>

        <div className="col-span-2" style={{ gridRow: "span 2" }}>
          <Ria10Card student={student} studentId={studentId} />
        </div>
        <div style={{ gridRow: "span 1" }}>
          <Ria04Card student={student} studentId={studentId} />
        </div>
        <div style={{ gridRow: "span 1" }}>
          <Ria11Card student={student} studentId={studentId} />
        </div>
      </div>
    </div>
  );
};
