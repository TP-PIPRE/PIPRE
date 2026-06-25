import { useCallback, useState } from "react";
import { apiService } from "../../infrastructure/api/apiService";
import type { SimulationRequest, SimulationResponse } from "../../infrastructure/api/models/apiModels";

interface UseRobotSimulationsReturn {
  submitSimulation: (
    data: SimulationRequest,
  ) => Promise<SimulationResponse | null>;
  simulations: SimulationResponse[];
  loading: boolean;
  error: string | null;
}

export function useRobotSimulations(): UseRobotSimulationsReturn {
  const [simulations, setSimulations] = useState<SimulationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitSimulation = useCallback(
    async (data: SimulationRequest) => {
      setLoading(true);
      setError(null);
      try {
        await apiService.simulations.postResult(data);
        const result: SimulationResponse = {
          id_simulation: "",
          result: data.result,
        };
        setSimulations((prev) => [result, ...prev]);
        return result;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Error al registrar simulación";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { submitSimulation, simulations, loading, error };
}
