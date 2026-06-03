// PMV01 – Plataforma educativa base
export interface UserRequestDTO {
  first_name: string;
  last_name: string;
  age: number;
  grade: string;
  email: string;
  passwordHash: string;
  institution: string;
  zone: string;
}

export interface UserResponseDTO {
  id_user: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface RoleDTO {
  id_role: string;
  name: string;
}

export interface GroupDTO {
  id_group: string;
  group_name: string;
}

export interface CourseRequestDTO {
  name: string;
  description: string;
  level: string;
}

export interface CourseResponseDTO {
  id_course: string;
  name: string;
  description?: string;
  level?: string;
}

export interface ModuleRequestDTO {
  id_course: string;
  title: string;
}

export interface ModuleResponseDTO {
  id_module: string;
  title: string;
}

export interface LessonRequestDTO {
  id_module: string;
  title: string;
}

export interface LessonResponseDTO {
  id_lesson: string;
  title: string;
}

export interface ActivityRequestDTO {
  id_lesson: string;
  name: string;
}

export interface ActivityResponseDTO {
  id_activity: string;
  name: string;
}

// DTOs para Retos (Challenges)
export interface ChallengeRequestDTO {
  id_course: string;
  title: string;
  description: string;
  order: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  points: number;
  simulatorConfig?: any; // Configuración específica para el simulador
  expectedOutput?: string; // Resultado esperado para validación
  reward?: {
    type: "BADGE" | "POINTS" | "UNLOCK_NEXT";
    value: string | number;
  };
}

export interface ChallengeResponseDTO {
  id: string;
  id_course: string;
  title: string;
  description: string;
  order: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  points: number;
  simulatorConfig?: any;
  expectedOutput?: string;
  reward?: {
    type: "BADGE" | "POINTS" | "UNLOCK_NEXT";
    value: string | number;
  };
}

// PMV02 – Gamificación y ranking
export interface ActivityResultRequest {
  id_student: string;
  id_activity: string;
  score: number;
  attempts: number;
}

export interface ActivityResultResponse {
  id_activity: string;
  score: number;
}

export interface RankingDTO {
  id_student: string;
  total_points: number;
  position: number;
}

export interface SimulationRequest {
  id_student: string;
  id_activity: string;
  result: string;
}

export interface SimulationResponse {
  id_simulation: string;
  result: string;
}

// PMV03 – Analítica inteligente
export interface ModuleProgressRequest {
  id_student: string;
  id_module: string;
  percentage: number;
}

export interface HelpRequest {
  id_student: string;
  times_requested: number;
  ai_interactions: number;
}

export interface DropoutRiskResponse {
  risk_level: string;
  performance: string;
  motivation_level: string;
}

// En src/infrastructure/models/apiModels.ts
export interface HomeResponseDTO {
  status: string; // Ejemplo: "ok" | "error"
  message?: string;
  data?: any; // Ajusta según lo que devuelva el endpoint /home
}
