// PMV01 – Plataforma educativa base
export interface UserRequestDTO {
  firstName: string;
  lastName: string;
  age: number;
  grade: string;
  email: string;
  passwordHash: string;
  institution: string;
  zone: string;
}

export interface UserResponseDTO {
  idUser: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface RoleDTO {
  idRole: string;
  name: string;
}

export interface GroupDTO {
  idGroup: string;
  groupName: string;
}

export interface CourseRequestDTO {
  name: string;
  description: string;
  level: string;
}

export interface CourseResponseDTO {
  idCourse: string;
  name: string;
  description?: string;
  level?: string;
}

export interface ModuleRequestDTO {
  idCourse: string;
  title: string;
}

export interface ModuleResponseDTO {
  idModule: string;
  title: string;
}

export interface LessonRequestDTO {
  idModule: string;
  title: string;
}

export interface LessonResponseDTO {
  idLesson: string;
  title: string;
}

export interface ActivityRequestDTO {
  idLesson: string;
  name: string;
}

export interface ActivityResponseDTO {
  idActivity: string;
  name: string;
}

// PMV02 – Gamificación y ranking
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

export interface RankingDTO {
  idStudent: string;
  totalPoints: number;
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
