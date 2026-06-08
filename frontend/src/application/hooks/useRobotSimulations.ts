import { useCallback, useState } from "react";
import { apiService } from "../../infrastructure/api/apiService";

export interface SimulationResultPayload {
  idStudent: string;
  idActivity: string;
  blocklyCode: string;
  pseudocode: string;
  pseintDiagram: string;
  blocksUsage: number;
  codeUsage: number;
  sensorError: number;
  resolutionTime: number;
  environment: string;
  missions: unknown[];
  startingPosition: { x: number; z: number };
  targetPosition: { x: number; z: number };
  result: string;
}

export interface ParsedSimulation {
  idSimulation: string;
  payload: SimulationResultPayload;
  date: string;
}

interface UseRobotSimulationsReturn {
  submitSimulation: (
    data: SimulationResultPayload,
  ) => Promise<ParsedSimulation | null>;
  simulations: ParsedSimulation[];
  loading: boolean;
  error: string | null;
}

function parseSimulation(sim: {
  id_simulation: string;
  result: string;
}): ParsedSimulation {
  let payload: SimulationResultPayload;
  try {
    payload = JSON.parse(sim.result);
  } catch {
    payload = {} as SimulationResultPayload;
  }
  return { idSimulation: sim.id_simulation, payload, date: "" };
}

export function useRobotSimulations(): UseRobotSimulationsReturn {
  const [simulations, setSimulations] = useState<ParsedSimulation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitSimulation = useCallback(
    async (data: SimulationResultPayload) => {
      setLoading(true);
      setError(null);
      try {
        await apiService.simulations.postResult({
          id_student: data.idStudent,
          id_activity: data.idActivity,
          result: JSON.stringify({ ...data, date: new Date().toISOString() }),
        });
        const updated = await apiService.simulations.getByUser(data.idStudent);
        const parsed = updated.map(parseSimulation);
        setSimulations(parsed);
        return parsed[parsed.length - 1] ?? null;
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
