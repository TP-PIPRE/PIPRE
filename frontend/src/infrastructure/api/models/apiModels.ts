export interface UserRequestDTO {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  grade: string;
  age: number;
  roleIdList: string[];
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

export interface CreateActivityCommand {
  idLesson: string;
  name: string;
}

export interface ActivityResponseDTO {
  idActivity: string;
  name: string;
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

export interface ModuleProgressRequest {
  idStudent: string;
  idModule: string;
  percentage: number;
}

export interface HelpRequest {
  idStudent: string;
  idActivity?: string;
  description: string;
}

export interface DropoutRiskResponse {
  riesgo: number;
  nivel: string;
}
