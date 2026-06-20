import { useCallback, useState } from "react";
import { specService } from "../../infrastructure/api/specService";
import type { RoboticsSimulationRequest, RoboticsSimulationResponse } from "../../shared/types/SpecContracts";

interface UseRobotSimulationsReturn {
  submitSimulation: (
    data: RoboticsSimulationRequest,
  ) => Promise<RoboticsSimulationResponse | null>;
  simulations: RoboticsSimulationResponse[];
  loading: boolean;
  error: string | null;
}

export function useRobotSimulations(): UseRobotSimulationsReturn {
  const [simulations, setSimulations] = useState<RoboticsSimulationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitSimulation = useCallback(
    async (data: RoboticsSimulationRequest) => {
      setLoading(true);
      setError(null);
      try {
        const result = await specService.roboticsSimulations.create(data);
        if (result) {
          setSimulations((prev) => [result, ...prev]);
          return result;
        }
        return null;
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
