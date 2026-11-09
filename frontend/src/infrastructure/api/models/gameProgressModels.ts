import type { AchievementDTO } from "./apiModels";

export type SimulatorGame = "neonflow" | "tetrilogic";
export interface GamePieceState { id?: string; type: string; x: number; y: number; rotation?: number; color?: string; }
export interface GameSessionContext {
  studentId: string; game: SimulatorGame; levelTemplate: string; activityId?: string; dailyChallengeId?: string;
}
export interface GameSessionDTO {
  sessionId: string; game: SimulatorGame; levelNumber: number; levelTemplate: string; ruleset: string;
  startedAt: string; status: "ACTIVE" | "COMPLETED" | "ABANDONED"; revision: number;
  state: { pieces: GamePieceState[]; moves: number; resets: number; helps: number; failedChecks: number; rejections: number; lastActionRejected?: boolean };
}
export interface GameAction {
  type: "PLACE" | "ROTATE" | "RETURN" | "RESET" | "HELP" | "CHECK" | "REJECT";
  pieceId?: string; x?: number; y?: number; rotation?: number; component?: string; color?: string; source?: string; hintId?: string;
}
export interface GameHintRequest { requestId: string; revision: number; locale: string; }
export interface GameHintResponse {
  requestId: string; hintId: string; revision: number; source: "RULE_BASED" | "GENERATIVE" | "STATIC";
  hintLevel: 1 | 2 | 3; type: string; message: string; targetCell?: { x: number; y: number } | null;
}
export interface DailyChallengeDTO {
  id: string; date: string; timeZone: "America/Lima"; game: SimulatorGame; levelNumber: number; levelTemplate: string;
  completed: boolean; currentStreak: number; bestStreak: number;
}
export interface GameVictoryDTO {
  score?: {points:number;bestPoints:number;pointsGained:number;totalPoints:number;dailyXpAwarded:number;version:string}|null;
  sessionId: string; game: SimulatorGame; levelNumber: number; stars: number; bestStars: number;
  completedAt: string; durationMs: number; newAchievements: AchievementDTO[]; daily: DailyChallengeDTO | null;
}
export interface LevelProgressDTO {
  game: SimulatorGame; levelNumber: number; completed: boolean; bestStars: number;
  firstCompletedAt?: string | null; lastCompletedAt?: string | null;
}
export interface GameProgressDTO {
  levels: LevelProgressDTO[]; completedLevels: number; totalLevels: number; totalStars: number; currentStreak: number; bestStreak: number;
}

export function isOfficialGameTemplate(game: SimulatorGame, template: string | undefined): template is string {
  if (!template) return false;
  const canonical = new RegExp(`^${game}-v2-([1-9]|[12]\\d|30)$`);
  return canonical.test(template) || (game === "neonflow" && /^neonflow-([3-9]|[12]\d|30)$/.test(template));
}

export interface GeneratedDailyChallengeDTO {
 id: string; date: string; slot: number; game: SimulatorGame; levelNumber: number; levelTemplate: string; difficulty: "easy" | "medium" | "hard";
 config: import("../../../shared/types/TetriLogic").LevelConfig | import("../../../shared/types/NeonFlow").NeonFlowLevelConfig;
 completedAt: string | null; bestStars: number; startedAt?: string | null; status?: "PENDING" | "IN_PROGRESS" | "COMPLETED";
}
export interface DailySetDTO { date: string; timeZone: string; expiresAt: string; challenges: GeneratedDailyChallengeDTO[]; }
