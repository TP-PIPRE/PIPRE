export interface Ria01PredictRequest {
  attempts: number;
  errors: number;
  logical_level: string;
  ai_interactions: number;
}

export interface Ria01PredictResponse {
  prediccion?: string;
  desempeno?: string;
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
