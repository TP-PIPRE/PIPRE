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
  const { result, predictedScore, environment, missions, startingPosition, targetPosition } = simulation;

  return (
    <div
      className="bg-surface border border-border p-6 animate-fade-in"
      style={{ borderRadius: "var(--theme-radius)" }}
    >
      <h3 className="text-[10px] uppercase font-bold tracking-widest text-text-muted mb-4">
        Resultado de Simulación
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 bg-bg border border-border">
          <div className="text-[10px] text-text-muted uppercase tracking-wider">
            Estado
          </div>
          <div className={`text-lg font-black mt-1 ${resultColors[result] ?? "text-text"}`}>
            {resultLabels[result] ?? result}
          </div>
        </div>

        <div className="p-3 bg-bg border border-border">
          <div className="text-[10px] text-text-muted uppercase tracking-wider">
            Puntaje
          </div>
          <div className="text-lg font-black text-primary mt-1">
            {predictedScore ?? "-"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-2 bg-bg border border-border text-center">
          <div className="text-xs font-bold text-text">{environment}</div>
          <div className="text-[8px] text-text-muted uppercase tracking-wider mt-0.5">
            Entorno
          </div>
        </div>
        <div className="p-2 bg-bg border border-border text-center">
          <div className="text-xs font-bold text-text">
            {missions?.length ?? 0} misiones
          </div>
          <div className="text-[8px] text-text-muted uppercase tracking-wider mt-0.5">
            Misiones
          </div>
        </div>
      </div>

      {startingPosition && targetPosition && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-2 bg-bg border border-border text-center">
            <div className="text-xs font-bold text-success">
              ({startingPosition.x}, {startingPosition.z})
            </div>
            <div className="text-[8px] text-text-muted uppercase tracking-wider mt-0.5">
              Inicio
            </div>
          </div>
          <div className="p-2 bg-bg border border-border text-center">
            <div className="text-xs font-bold text-danger">
              ({targetPosition.x}, {targetPosition.z})
            </div>
            <div className="text-[8px] text-text-muted uppercase tracking-wider mt-0.5">
              Objetivo
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
