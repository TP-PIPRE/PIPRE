import { apiService } from "../../infrastructure/api/apiService";
import { simuladorRepository } from "../../infrastructure/adapters/storage/SimuladorRepository";

import type { Block, MissionTemplate, EnvironmentType, StudentResult } from "../../shared/types/Simulador";
import { ENVIRONMENT_CONFIGS } from "../../shared/constants/environmentConfigs";

export interface ChallengeData {
  id: string;
  idCourse: string;
  title: string;
  description: string;
  order: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  points: number;
  environment: EnvironmentType;
  missions: MissionTemplate[];
  maxBlocks: number;
  expectedOutput?: string;
  reward?: { type: string; value: string | number };
  startingPosition?: { x: number; z: number };
  targetPosition?: { x: number; z: number };
}

export class SimuladorUseCase {
  async loadChallengesByCourse(courseId: string): Promise<ChallengeData[]> {
    try {
      const modules = await apiService.modules.getByCourse(courseId);
      if (modules.length === 0) return [];

      const lessons = (await Promise.all(
        modules.map((mod) => apiService.lessons.getByModule(mod.idModule)),
      )).flat();
      if (lessons.length === 0) return [];

      const activities = (await Promise.all(
        lessons.map((lesson) => apiService.activities.getByLesson(lesson.idLesson)),
      )).flat();

      return activities
        .filter((act) => act.type === "robotics")
        .map((act, i) => ({
          id: act.idActivity,
          idCourse: courseId,
          title: act.name,
          description: "",
          order: i + 1,
          difficulty: (act.difficulty as "EASY" | "MEDIUM" | "HARD") || "EASY",
          points: 100,
          environment: (act.environment as EnvironmentType) || "battle",
          missions: (act.missions as MissionTemplate[]) || [],
          maxBlocks: 10,
          startingPosition: act.startingPosition as { x: number; z: number } | undefined,
          targetPosition: act.targetPosition as { x: number; z: number } | undefined,
        }));
    } catch (error) {
      console.error("Error loading challenges from API:", error);
      return [];
    }
  }

  getEnvironmentConfig(environment: EnvironmentType) {
    return ENVIRONMENT_CONFIGS[environment];
  }

  getBlocksForEnvironment(environment: EnvironmentType) {
    const config = ENVIRONMENT_CONFIGS[environment];
    return config?.blocks || [];
  }

  getHardwareForEnvironment(environment: EnvironmentType) {
    const config = ENVIRONMENT_CONFIGS[environment];
    return config?.hardware || [];
  }

  getMissionsForChallenge(
    challenge: ChallengeData | null,
    environment: EnvironmentType,
  ) {
    if (challenge && challenge.missions.length > 0) {
      return challenge.missions;
    }
    const config = ENVIRONMENT_CONFIGS[environment];
    return config?.missions || [];
  }

  validateMissionCompletion(
    blocks: Block[],
    mission: { maxBlocks: number; isCompleted?: boolean },
    energy: number,
    position?: { x: number; z: number },
    targetPosition?: { x: number; z: number },
  ): { completed: boolean; score: number; feedback: string } {
    let score = 0;
    let feedback = "";

    if (blocks.length === 0 && mission.maxBlocks > 0) {
      return { completed: false, score: 0, feedback: "No hay bloques en el programa." };
    }

    if (mission.maxBlocks > 0 && blocks.length > mission.maxBlocks) {
      feedback = `Demasiados bloques: ${blocks.length}/${mission.maxBlocks}`;
      score = Math.max(0, 100 - (blocks.length - mission.maxBlocks) * 20);
    } else {
      score = 100;
      feedback = "Carga de datos dentro del límite.";
    }

    if (targetPosition && position) {
      const dx = position.x - targetPosition.x;
      const dz = position.z - targetPosition.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      if (distance < 3) {
        score += 200;
        feedback += " ¡Posición objetivo alcanzada!";
      } else {
        feedback += ` Distancia a objetivo: ${Math.round(distance)} unidades.`;
      }
    }

    const efficiencyBonus = mission.maxBlocks > 0 && blocks.length <= mission.maxBlocks ? 300 : 0;
    const energyBonus = Math.round(energy * 5);
    score += efficiencyBonus + energyBonus;

    const completed = score >= 100;

    return { completed, score, feedback };
  }

  calculateScore(
    blocks: Block[],
    energy: number,
    mission: { maxBlocks: number },
  ): number {
    let points = 500;
    if (blocks.length <= mission.maxBlocks) points += 300;
    points += energy * 5;
    return points;
  }

  async saveResult(result: StudentResult): Promise<void> {
    try {
      await apiService.results.postResult({
        idStudent: result.studentId,
        idActivity: result.challengeId,
        score: result.score,
        attempts: 1,
      });
    } catch (error) {
      console.warn("Backend no disponible, guardando resultado localmente:", error);
    }

    simuladorRepository.saveResult(result);
  }
}
