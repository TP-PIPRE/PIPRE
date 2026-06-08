import type { ParsedSimulation } from "../../../application/hooks/useRobotSimulations";

interface SimulationResultPanelProps {
  simulation: ParsedSimulation;
}

export const SimulationResultPanel = ({
  simulation,
}: SimulationResultPanelProps) => {
  const p = simulation.payload;
  const result = p.result || "unknown";

  const resultColors: Record<string, string> = {
    SUCCESS: "text-success",
    PARTIAL: "text-accent",
    FAILED: "text-danger",
    ABANDONED: "text-text-muted",
    TIMEOUT: "text-warning",
  };

  const resultLabels: Record<string, string> = {
    SUCCESS: "Éxito",
    PARTIAL: "Parcial",
    FAILED: "Fallido",
    ABANDONED: "Abandonado",
    TIMEOUT: "Tiempo agotado",
  };

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
          <div
            className={`text-lg font-black mt-1 ${resultColors[result] ?? "text-text"}`}
          >
            {resultLabels[result] ?? result}
          </div>
        </div>

        <div className="p-3 bg-bg border border-border">
          <div className="text-[10px] text-text-muted uppercase tracking-wider">
            Puntaje
          </div>
          <div className="text-lg font-black text-primary mt-1">
            {p.predictedScore ?? p.blocksUsage ?? "-"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="p-2 bg-bg border border-border text-center">
          <div className="text-xs font-bold text-text">{p.blocksUsage}</div>
          <div className="text-[8px] text-text-muted uppercase tracking-wider mt-0.5">
            Bloques
          </div>
        </div>
        <div className="p-2 bg-bg border border-border text-center">
          <div className="text-xs font-bold text-text">{p.codeUsage}</div>
          <div className="text-[8px] text-text-muted uppercase tracking-wider mt-0.5">
            Código
          </div>
        </div>
        <div className="p-2 bg-bg border border-border text-center">
          <div className="text-xs font-bold text-text">
            {p.sensorError != null ? `${(p.sensorError * 100).toFixed(0)}%` : "-"}
          </div>
          <div className="text-[8px] text-text-muted uppercase tracking-wider mt-0.5">
            Error
          </div>
        </div>
        <div className="p-2 bg-bg border border-border text-center">
          <div className="text-xs font-bold text-text">
            {p.resolutionTime != null ? `${(p.resolutionTime / 1000).toFixed(1)}s` : "-"}
          </div>
          <div className="text-[8px] text-text-muted uppercase tracking-wider mt-0.5">
            Tiempo
          </div>
        </div>
      </div>

      {simulation.date && (
        <div className="text-[10px] text-text-muted">
          {new Date(simulation.date).toLocaleString("es-ES")}
        </div>
      )}
    </div>
  );
};
