import { apiService } from "../../infrastructure/api/apiService";
import type { Block, MissionTemplate, EnvironmentType, StudentResult } from "../../shared/types/Simulador";
import { ENVIRONMENT_CONFIGS } from "../../shared/constants/environmentConfigs";

export interface ChallengeData {
  id: string;
  id_course: string;
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

const MOCK_CHALLENGES: Record<string, ChallengeData[]> = {
  "1": [
    {
      id: "ch-battle-1",
      id_course: "1",
      title: "Introducción al Combate",
      description: "Aprende los movimientos básicos de tu robot de batalla.",
      order: 1,
      difficulty: "EASY",
      points: 100,
      environment: "battle",
      missions: [
        { id: "cb1", title: "Movimiento Básico", objective: "Avanza hacia el centro de la arena.", maxBlocks: 1 },
      ],
      maxBlocks: 1,
    },
    {
      id: "ch-space-1",
      id_course: "1",
      title: "Aterrizaje Lunar",
      description: "Pilota tu módulo hasta la superficie lunar.",
      order: 2,
      difficulty: "EASY",
      points: 100,
      environment: "space",
      missions: [
        { id: "cs1", title: "Descenso", objective: "Despega y aterriza en la zona marcada.", maxBlocks: 2 },
      ],
      maxBlocks: 2,
    },
  ],
  "2": [
    {
      id: "ch-maze-1",
      id_course: "2",
      title: "El Faro del Laberinto",
      description: "Enciende los faros mágicos para iluminar el camino.",
      order: 1,
      difficulty: "EASY",
      points: 150,
      environment: "maze",
      missions: [
        { id: "cm1", title: "Iluminación", objective: "Usa [ILUMINAR] para revelar el camino.", maxBlocks: 2 },
      ],
      maxBlocks: 2,
    },
    {
      id: "ch-race-1",
      id_course: "2",
      title: "Primera Vuelta",
      description: "Completa una vuelta a la pista de obstáculos.",
      order: 2,
      difficulty: "MEDIUM",
      points: 200,
      environment: "obstacle",
      missions: [
        { id: "cr1", title: "Vuelta Rápida", objective: "Llega a la meta esquivando los obstáculos.", maxBlocks: 4 },
      ],
      maxBlocks: 4,
    },
  ],
};

export class SimuladorUseCase {
  /* BACKEND:
   * Cargar retos desde el API:
   * async loadChallengesByCourse(courseId: string): Promise<ChallengeData[]> {
   *   try {
   *     const response = await apiService.challenges.getByCourse(courseId);
   *     return response.map((c: ChallengeResponseDTO) => ({
   *       id: c.id,
   *       id_course: c.id_course,
   *       title: c.title,
   *       description: c.description,
   *       order: c.order,
   *       difficulty: c.difficulty,
   *       points: c.points,
   *       environment: c.simulatorConfig?.environment || "battle",
   *       missions: c.simulatorConfig?.missions || [],
   *       maxBlocks: c.simulatorConfig?.maxBlocks || 10,
   *       expectedOutput: c.expectedOutput,
   *       reward: c.reward,
   *     }));
   *   } catch (error) {
   *     console.error("Error loading challenges, using fallback:", error);
   *     return this.getFallbackChallenges(courseId);
   *   }
   * }
   */

  loadChallengesByCourse(courseId: string): ChallengeData[] {
    /* BACKEND: Reemplazar con llamada al API real usando apiService.challenges.getByCourse(courseId) */
    return MOCK_CHALLENGES[courseId] || [];
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

  // Almacenamiento mock en memoria (reemplazar con BD)
  // Shared between use case and ranking page
  mockResults: StudentResult[] = [];

  private mockStudentSeed: { id: string; name: string; courseId: string; courseName: string }[] = [
    { id: "student-2", name: "Ana Sofía Lopez", courseId: "1", courseName: "Robótica Nivel 1" },
    { id: "student-3", name: "Carlos Ruiz", courseId: "2", courseName: "Programación de Microcontroladores" },
    { id: "student-4", name: "Elena García", courseId: "1", courseName: "Robótica Nivel 1" },
    { id: "student-5", name: "Marcos Soto", courseId: "2", courseName: "Programación de Microcontroladores" },
    { id: "student-6", name: "Lucía Méndez", courseId: "1", courseName: "Robótica Nivel 1" },
  ];

  async saveResult(result: StudentResult): Promise<StudentResult> {
    try {
      await apiService.results.postResult({
        id_student: result.studentId,
        id_activity: result.challengeId,
        score: result.score,
        attempts: 1,
      });
    } catch (error) {
      console.warn("Backend no accesible, guardando resultado localmente:", error);
    }

    const existingIndex = this.mockResults.findIndex(
      (r) => r.studentId === result.studentId && r.courseId === result.courseId && r.challengeId === result.challengeId,
    );

    if (existingIndex >= 0) {
      const existing = this.mockResults[existingIndex];
      if (result.score > existing.score) {
        this.mockResults[existingIndex] = { ...result, completedAt: new Date().toISOString() };
      }
      return this.mockResults[existingIndex];
    }

    const saved: StudentResult = { ...result, completedAt: result.completedAt || new Date().toISOString() };
    this.mockResults.push(saved);
    return saved;
  }
}
