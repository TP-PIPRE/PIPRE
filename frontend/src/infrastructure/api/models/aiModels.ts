export interface Ria01PredictRequest {
  attempts: number;
  errors: number;
  logical_level: string;
  ai_interactions: number;
}

export interface Ria01PredictResponse {
  prediccion?: string;
  desempeno?: string;
  score?: number;
  success_rate?: number;
  attempts?: number;
  ai_interactions?: number;
  completed_activities?: number;
  [key: string]: unknown;
}

export interface Ria03RecommendRequest {
  logical_level: string;
  inactive_days: number;
  ai_interactions: number;
  attempts: number;
}

export interface Ria03RecommendResponse {
  recomendaciones?: string[];
  actividades?: string[];
  [key: string]: unknown;
}

export interface Ria04DifficultyRequest {
  score: number;
  success_rate: number;
  errors: number;
  attempts: number;
  help_requested: number;
  completed_activities: number;
  inactive_days: number;
  logical_level: string;
}

export interface Ria04DifficultyResponse {
  dificultad?: string;
  nivel?: string;
  puntaje?: number;
  [key: string]: unknown;
}

export interface Ria08AnomalyRequest {
  attempts: number;
  errors: number;
  score: number;
  inactive_days: number;
}

export interface Ria08AnomalyResponse {
  anomalia?: boolean;
  es_anomalia?: boolean;
  detalles?: string;
  score?: number;
  errors?: number;
  [key: string]: unknown;
}

export interface Ria11TimeRequest {
  attempts: number;
  errors: number;
  ai_interactions: number;
  inactive_days: number;
  help_requested: number;
  completed_activities: number;
  age: number;
  grade: number;
  logical_level: string;
}

export interface Ria11TimeResponse {
  clasificacion?: string;
  tiempo_estimado?: string;
  [key: string]: unknown;
}

export interface Ria10PedagogicalRequest {
  attempts: number;
  errors: number;
  ai_interactions: number;
  inactive_days: number;
  help_requested: number;
  completed_activities: number;
  grade: number;
  logical_level: string;
}

export interface Ria10PedagogicalResponse {
  [key: string]: unknown;
}

export interface RiaInfoResponse {
  modelo?: string;
  version?: string;
  metricas?: Record<string, number>;
  features?: string[];
  umbrales?: Record<string, number>;
  ratio_anomalias?: number;
  estado?: string;
  [key: string]: unknown;
}

export interface HealthResponse {
  status?: string;
  message?: string;
  [key: string]: unknown;
}

export interface ChallengeContext {
  title: string;
  description?: string;
  max_blocks: number;
  environment: string;
  difficulty?: string;
  missions?: unknown[];
  starting_position?: { x: number; z: number };
  target_position?: { x: number; z: number };
}

export interface CodeFeedbackRequest {
  id_student: string;
  id_activity?: string;
  blockly_code: string;
  pseudocode: string;
  pseint_diagram?: string;
  ml_features: Record<string, unknown>;
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
