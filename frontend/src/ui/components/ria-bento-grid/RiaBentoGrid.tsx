import { useEffect, useState } from "react";
import { aiService } from "../../../infrastructure/api/aiService";
import { Ria01Card } from "./cards/Ria01Card";
import { Ria03Card } from "./cards/Ria03Card";
import { Ria04Card } from "./cards/Ria04Card";
import { Ria08Card } from "./cards/Ria08Card";
import { Ria10Card } from "./cards/Ria10Card";
import { Ria11Card } from "./cards/Ria11Card";
import { ModelStatusCard } from "./cards/ModelStatusCard";

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

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-mono font-bold tracking-tight mb-2" style={{ color: "var(--text)" }}>
          Dashboard de Resultados IA
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Análisis multidimensional de desempeño del estudiante
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 auto-rows-min">
        <div className="col-span-1" style={{ gridRow: "span 2" }}>
          <Ria01Card student={student} studentId={studentId} />
        </div>
        <div className="col-span-1" style={{ gridRow: "span 2" }}>
          <Ria03Card student={student} studentId={studentId} />
        </div>
        <div className="col-span-1" style={{ gridRow: "span 2" }}>
          <Ria08Card student={student} studentId={studentId} />
        </div>
        <div className="col-span-1" style={{ gridRow: "span 1" }}>
          <Ria11Card student={student} studentId={studentId} />
        </div>
        <div className="col-span-1" style={{ gridRow: "span 1" }}>
          <Ria04Card student={student} studentId={studentId} />
        </div>

        <div className="col-span-4" style={{ gridRow: "span 3" }}>
          <Ria10Card student={student} studentId={studentId} />
        </div>

        <div className="col-span-4" style={{ gridRow: "span 2" }}>
          <ModelStatusCard health={health} />
        </div>
      </div>
    </div>
  );
};
