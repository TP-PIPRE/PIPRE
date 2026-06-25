import type { EnvironmentType, MissionTemplate } from "./Simulador";

export type SimulationResult = "SUCCESS" | "PARTIAL" | "FAILED" | "ABANDONED" | "TIMEOUT";

export interface Position {
  x: number;
  z: number;
}

export interface RobotSimulationRequest {
  idStudent: string;
  idActivity: string;
  blocklyCode: string;
  pseudocode: string;
  pseintDiagram: string;
  blocksUsage: number;
  codeUsage: number;
  sensorError: number;
  resolutionTime: number;
  environment: EnvironmentType;
  missions: MissionTemplate[];
  startingPosition: Position;
  targetPosition: Position;
  result: SimulationResult;
}

export interface RobotSimulationResponse {
  idSimulation: string;
  idStudent: string;
  idActivity: string;
  student: { idUser: string; firstName: string; lastName: string };
  activity: { idActivity: string; name: string };
  environment: EnvironmentType;
  missions: MissionTemplate[];
  startingPosition: Position;
  targetPosition: Position;
  result: SimulationResult;
  predictedScore: number;
  blocklyCode: string;
  pseudocode: string;
  pseintDiagram: string;
  blocksUsage: number;
  codeUsage: number;
  sensorError: number;
  resolutionTime: number;
  date: string;
}

export interface SimulationMetrics {
  blocksUsage: number;
  codeUsage: number;
  sensorError: number;
  resolutionTime: number;
}
