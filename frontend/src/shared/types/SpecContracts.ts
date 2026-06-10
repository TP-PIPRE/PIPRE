import type { EnvironmentType } from "./Simulador";
import type { Position } from "./RobotSimulation";

export type SimulationResultType = "SUCCESS" | "FAILURE" | "PARTIAL";

export interface Mission {
  id: string;
  title: string;
  objective: string;
  maxBlocks: number;
}

export interface GroupInfo {
  id: string;
  name: string;
  description: string;
}

export interface ActivityCreate {
  idLesson: string;
  name: string;
  complexity: "EASY" | "MEDIUM" | "HARD";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  logicLevel: number;
  type: "robotics";
  environment: EnvironmentType;
  missions: Mission[];
  startingPosition: Position;
  targetPosition: Position;
}

export interface ActivityResponse {
  id: string;
  name: string;
  complexity: "EASY" | "MEDIUM" | "HARD";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  logicLevel: number;
  type: "robotics";
  environment: EnvironmentType;
  missions: Mission[];
  startingPosition: Position;
  targetPosition: Position;
}

export interface RoboticsSimulationRequest {
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
  missions: Mission[];
  startingPosition: Position;
  targetPosition: Position;
  result: SimulationResultType;
}

export interface RoboticsSimulationResponse {
  idSimulation: string;
  student: Record<string, unknown>;
  activity: Record<string, unknown>;
  environment: EnvironmentType;
  missions: Mission[];
  startingPosition: Position;
  targetPosition: Position;
  result: SimulationResultType;
  predictedScore: number;
}

export interface ActivityResultRequest {
  idStudent: string;
  idActivity: string;
  score: number;
  attempts: number;
}

export interface ActivityResultResponse {
  id: string;
  idStudent: string;
  idActivity: string;
  score: number;
  date: string;
}

export interface CodeFeedbackAnalyzeResponse {
  hints: string[];
  predicted_score: number;
  detected_patterns: string[];
  mission_feedback: Record<string, string>;
  environment_feedback: Record<string, string>;
}

export interface PSeIntGenerateRequest {
  blockly_code: string;
}

export interface PSeIntGenerateResponse {
  pseudocode: string;
  pseint_diagram: string;
}
