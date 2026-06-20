export type SimulationResultType = "SUCCESS" | "FAILURE" | "PARTIAL";

export interface GroupInfo {
  idGroup: string;
  groupName: string;
}

export interface ActivityResponse {
  idActivity: string;
  name: string;
}

export interface RoboticsSimulationRequest {
  id_student: string;
  id_activity: string;
  result: SimulationResultType;
}

export interface RoboticsSimulationResponse {
  id_simulation: string;
  result: string;
}

export interface ActivityResultRequest {
  idStudent: string;
  idActivity: string;
  score: number;
  attempts: number;
}

export interface ActivityResultResponse {
  idActivity: string;
  score: number;
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
