export interface UserRequestDTO {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  grade: string;
  age: number;
  roleIdList: string[];
  institution?: string;
  zone?: string;
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

export interface PositionDTO {
  x: number;
  z: number;
}

export interface MissionDTO {
  id: string;
  title: string;
  objective: string;
  maxBlocks: number;
}

export interface CreateActivityCommand {
  idLesson: string;
  name: string;
  complexity?: string;
  difficulty?: string;
  logicLevel?: number;
  type?: string;
  environment?: string;
  missions?: MissionDTO[];
  startingPosition?: PositionDTO;
  targetPosition?: PositionDTO;
}

export interface ActivityResponseDTO {
  idActivity: string;
  name: string;
  idLesson?: string;
  complexity?: string;
  difficulty?: string;
  logicLevel?: number;
  type?: string;
  environment?: string;
  startingPosition?: PositionDTO;
  targetPosition?: PositionDTO;
  missions?: MissionDTO[];
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
  idStudent: string;
  idActivity: string;
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

// --- Nuevos modelos para API paginada (Spring Page) y login ---

export interface AuthUserResponseDTO {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface LoginResponseDTO {
  message: string;
  user: AuthUserResponseDTO;
}

export interface Pageable {
  page?: number;
  size?: number;
  sort?: string[];
}

export interface PageCourseDTO {
  content: CourseResponseDTO[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  empty: boolean;
}

export interface PageModuleDTO {
  content: ModuleResponseDTO[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  empty: boolean;
}

export interface PageActivityDTO {
  content: ActivityResponseDTO[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  empty: boolean;
}
