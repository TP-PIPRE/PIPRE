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
  description: string | null;
}

export interface CourseRequestDTO {
  name: string;
  description: string;
  level: "LOW" | "MEDIUM" | "HIGH";
}

export interface CourseResponseDTO {
  idCourse: string;
  name: string;
  description?: string | null;
  level?: CourseRequestDTO["level"];
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
  idResult: string;
  idStudent: string;
  idActivity: string;
  score: number;
  attempts: number;
  date: string;
}

export interface RankingDTO {
  idStudent: string;
  studentName: string;
  totalPoints: number;
  position: number;
  level: number;
  xpTotal: number;
  totalStars: number;
  currentStreak: number;
  maxStreak: number;
}

export interface SimulationRequest {
  idStudent: string;
  idActivity: string;
  result: string;
  blocklyCode?: string;
  pseudocode?: string;
  pseintDiagram?: string;
  blocksUsage?: number;
  codeUsage?: number;
  sensorError?: number;
  resolutionTime?: number;
  environment?: string;
  missions?: MissionDTO[];
  startingPosition?: PositionDTO;
  targetPosition?: PositionDTO;
}

export interface SimulationResponse {
  idSimulation: string;
  student: UserResponseDTO;
  activity: { idActivity: string; name: string };
  environment: string | null;
  missions: MissionDTO[] | null;
  startingPosition: PositionDTO | null;
  targetPosition: PositionDTO | null;
  result: string;
  predictedScore: number | null;
}

export interface ModuleProgressRequest {
  idStudent: string;
  idModule: string;
  percentage: number;
  status: string;
}

export interface ModuleProgressDTO extends ModuleProgressRequest {
  idProgress: string;
  updatedAt: string;
}

export interface HelpRequest {
  idStudent: string;
  aiInteractions: number;
}

export interface HelpRequestDTO extends HelpRequest {
  idHelpRequest: string;
  requestedAt: string;
}

export interface DropoutRiskResponse {
  idRisk: string;
  daysInactive: number;
  performance: string;
  riskLevel: string;
  motivationLevel: string;
  analysisDate: string;
  idStudent: string;
}

export interface PageDTO<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  empty: boolean;
}

// --- Nuevos modelos para API paginada (Spring Page) y login ---

export interface AuthUserResponseDTO {
  idUser: string;
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

export interface PlayerProfileDTO {
  idStudent: string;
  studentName: string;
  totalPoints: number;
  position: number;
  level: number;
  xpTotal: number;
  totalStars: number;
  currentStreak: number;
  maxStreak: number;
  challengesCompleted: number;
  totalBlocksUsed: number;
  efficiencyAvg: number;
}

export interface AchievementDTO {
  idAchievement: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  hidden: boolean;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface StudentHistoryDTO {
  idResult: string;
  idActivity: string;
  activityName: string;
  score: number;
  stars: number;
  xpEarned: number;
  efficiency: number;
  dateAttempted: string;
}

export interface PageActivityDTO {
  content: ActivityResponseDTO[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  empty: boolean;
}
