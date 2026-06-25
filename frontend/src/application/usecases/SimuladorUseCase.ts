import { apiService } from "../../infrastructure/api/apiService";
import { getAuthState } from "../../infrastructure/store/authStore";
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
}

export class SimuladorUseCase {
  async loadChallengesByCourse(courseId: string): Promise<ChallengeData[]> {
    try {
      const authUser = getAuthState().user;
      const userId = authUser?.id || "config-store";
      const sims = await apiService.simulations.getByUser(userId);
      const configs = sims
        .map((s) => {
          try {
            return { ...JSON.parse(s.result), id_simulation: s.id_simulation };
          } catch {
            return null;
          }
        })
        .filter((x): x is Record<string, unknown> => x !== null);

      const grouped = new Map<string, Record<string, unknown>>();
      for (const c of configs) {
        const key = c.id_activity || c.id_simulation;
        if (!grouped.has(key) || (c.id_simulation > grouped.get(key).id_simulation)) {
          grouped.set(key, c);
        }
      }

      return Array.from(grouped.values())
        .filter((c: Record<string, unknown>) => c.type === "challenge" && c.courseId === courseId && !c.deleted)
        .sort((a: Record<string, unknown>, b: Record<string, unknown>) => ((a.order as number) || 0) - ((b.order as number) || 0))
        .map((c: Record<string, unknown>) => ({
          id: c.id_activity || c.id_simulation,
          idCourse: c.courseId,
          title: c.title || "Sin título",
          description: c.description || "",
          order: c.order || 1,
          difficulty: c.difficulty || "EASY",
          points: c.points || 100,
          environment: c.environment || "battle",
          missions: c.missions || [],
          maxBlocks: c.maxBlocks || 10,
          expectedOutput: c.expectedOutput,
          reward: c.reward,
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
