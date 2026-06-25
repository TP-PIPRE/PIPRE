import type { EnvironmentType, MissionTemplate } from "./Simulador";
import type { Position } from "./RobotSimulation";

export interface MLFeatures {
  attempts: number;
  errors: number;
  logical_level: string;
  ai_interactions: number;
  help_requested: number;
  completed_activities: number;
  inactive_days: number;
  score: number;
  success_rate: number;
}

export interface ChallengeContext {
  title: string;
  description?: string;
  max_blocks: number;
  environment: EnvironmentType;
  difficulty?: string;
  missions?: MissionTemplate[];
  starting_position?: Position;
  target_position?: Position;
}

export interface CodeFeedbackRequest {
  id_student: string;
  id_activity?: string;
  blockly_code: string;
  pseudocode: string;
  pseint_diagram?: string;
  ml_features: Partial<MLFeatures>;
  challenge_context: ChallengeContext;
}

export interface CodeHint {
  severity: "info" | "warning" | "error";
  message: string;
  block_type?: string;
  line?: number;
}

export interface CodeFeedbackResponse {
  feedback_summary: string;
  hints: CodeHint[];
  detected_patterns: string[];
  suggested_blocks: string[];
  predicted_score: number;
  mission_feedback?: string;
  environment_feedback?: string;
  generated_by: string;
}

export interface PSeIntGenerateRequest {
  blockly_code: string;
}

export interface PSeIntGenerateResponse {
  pseudocode: string;
  pseint_diagram: string;
}

export interface AggregatedFeaturesResponse {
  id_student: string;
  attempts: number;
  errors: number;
  logical_level: string;
  ai_interactions: number;
  help_requested: number;
  completed_activities: number;
  inactive_days: number;
  success_rate: number;
  score: number;
}
