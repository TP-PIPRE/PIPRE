import type { RoboticsSimulationResponse } from "../../../shared/types/SpecContracts";

interface SimulationResultPanelProps {
  simulation: RoboticsSimulationResponse;
}

const resultColors: Record<string, string> = {
  SUCCESS: "text-success",
  PARTIAL: "text-accent",
  FAILURE: "text-danger",
};

const resultLabels: Record<string, string> = {
  SUCCESS: "Éxito",
  PARTIAL: "Parcial",
  FAILURE: "Fallido",
};

export const SimulationResultPanel = ({
  simulation,
}: SimulationResultPanelProps) => {
  const { result } = simulation;

  return (
    <div
      className="bg-surface border border-border p-4 animate-fade-in"
      style={{ borderRadius: "var(--theme-radius)" }}
    >
      <h3 className="text-[10px] uppercase font-bold tracking-widest text-text-muted mb-3">
        Resultado de Simulación
      </h3>

      <div className="p-3 bg-bg border border-border text-center">
        <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">
          Estado
        </div>
        <div className={`text-lg font-black ${resultColors[result] ?? "text-text"}`}>
          {resultLabels[result] ?? result}
        </div>
      </div>
    </div>
  );
};
