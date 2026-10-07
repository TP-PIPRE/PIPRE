import { Link, useParams } from "react-router-dom";
import { NeonFlowStage } from "../components/NeonFlow/NeonFlowStage";
import { TetriLogicStage } from "../components/TetriLogic/TetriLogicStage";

const NEONFLOW_IDS = new Set(["1", "neonflow", "logica", "c001"]);
const TETRILOGIC_IDS = new Set(["2", "tetrilogic", "patrones", "c002"]);

export const Simulador = () => {
  const { courseId } = useParams<{ courseId?: string }>();
  const normalized = (courseId ?? "").trim().toLowerCase();

  if (NEONFLOW_IDS.has(normalized)) return <NeonFlowStage />;
  if (TETRILOGIC_IDS.has(normalized)) return <TetriLogicStage />;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <div className="rounded-xl bg-surface border border-border shadow-lg p-8 text-center">
        <p className="text-sm font-bold text-text">
          Selecciona un curso válido para iniciar el simulador
        </p>
        <Link
          to="/"
          className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
};
