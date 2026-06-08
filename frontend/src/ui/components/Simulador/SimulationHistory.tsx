import type { ParsedSimulation } from "../../../application/hooks/useRobotSimulations";
import { SimulationResultPanel } from "./SimulationResultPanel";

interface SimulationHistoryProps {
  simulations: ParsedSimulation[];
  onSelect?: (sim: ParsedSimulation) => void;
}

export const SimulationHistory = ({
  simulations,
  onSelect,
}: SimulationHistoryProps) => {
  if (simulations.length === 0) {
    return (
      <div className="p-6 text-center text-text-muted text-sm border border-dashed border-border">
        No hay simulaciones registradas aún.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-[10px] uppercase font-bold tracking-widest text-text-muted mb-1">
        Historial de Simulaciones ({simulations.length})
      </h3>
      {simulations.map((sim) => (
        <button
          key={sim.idSimulation}
          onClick={() => onSelect?.(sim)}
          className="w-full text-left hover:opacity-80 transition-opacity"
        >
          <SimulationResultPanel simulation={sim} />
        </button>
      ))}
    </div>
  );
};
