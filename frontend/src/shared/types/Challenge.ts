import type { EnvironmentType, MissionTemplate } from "./Simulador";
import type { Position } from "./RobotSimulation";

export type DifficultyLevel = "EASY" | "MEDIUM" | "HARD";
export type ComplexityLevel = "LOW" | "MEDIUM" | "HIGH";
export type ActivityType = "robotics" | "theoretical" | "quiz";

export interface ChallengeSimulatorConfig {
  environment: EnvironmentType;
  missions: MissionTemplate[];
  maxBlocks: number;
  initialPosition?: { x: number; z: number };
  targetPosition?: { x: number; z: number };
}

export interface Challenge {
  id: string;
  idCourse: string;
  idModule?: string;
  idGroup?: string;
  idLesson?: string;
  title: string;
  description: string;
  order: number;
  difficulty: DifficultyLevel;
  points: number;
  isUnlocked: boolean;
  simulatorConfig: ChallengeSimulatorConfig;
  expectedOutput: string;
  reward: {
    type: "BADGE" | "POINTS" | "UNLOCK_NEXT";
    value: string | number;
  };
}

export interface ActivityCreateRequest {
  idLesson: string;
  name: string;
  complexity: ComplexityLevel;
  difficulty: DifficultyLevel;
  logicLevel: number;
  type: ActivityType;
  environment?: EnvironmentType;
  missions?: MissionTemplate[];
  startingPosition?: Position;
  targetPosition?: Position;
}

export interface ActivityResponse {
  idActivity: string;
  name: string;
  complexity?: ComplexityLevel;
  difficulty?: DifficultyLevel;
  logicLevel?: number;
  type?: ActivityType;
}
