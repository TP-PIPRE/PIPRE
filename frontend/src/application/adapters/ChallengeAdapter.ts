import type { ChallengeData } from "../usecases/SimuladorUseCase";
import type { EnvironmentType, MissionTemplate } from "../../shared/types/Simulador";

export interface AdaptedChallenge {
  id: string;
  title: string;
  description: string;
  environment: EnvironmentType;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  points: number;
  missions: MissionTemplate[];
  maxBlocks: number;
  requiredHardware: string[];
  allowedBlockTypes: string[];
  startingPosition?: { x: number; z: number };
  targetPosition?: { x: number; z: number };
}

export interface ActivityChallengeData {
  idActivity: string;
  name: string;
  complexity?: string;
  difficulty?: string;
  logicLevel?: number;
  type?: string;
  environment?: string;
  missions?: MissionTemplate[];
  startingPosition?: { x: number; z: number };
  targetPosition?: { x: number; z: number };
}

export class ChallengeAdapter {
  static adaptChallenge(challenge: ChallengeData): AdaptedChallenge {
    return {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      environment: challenge.environment || "obstacle",
      difficulty: challenge.difficulty || "EASY",
      points: challenge.points || 100,
      missions: challenge.missions || [],
      maxBlocks: challenge.maxBlocks || 10,
      requiredHardware: this.getRequiredHardware(challenge.environment),
      allowedBlockTypes: this.getAllowedBlockTypes(challenge.environment),
      startingPosition: { x: 0, z: 0 },
      targetPosition: { x: 30, z: 0 },
    };
  }

  static adaptActivityToChallenge(
    activity: ActivityChallengeData
  ): AdaptedChallenge {
    const environment = this.mapActivityEnvironment(activity.environment);

    return {
      id: activity.idActivity,
      title: activity.name,
      description: `${activity.name} - Nivel ${activity.logicLevel || 1}`,
      environment,
      difficulty: this.mapDifficulty(activity.difficulty),
      points: this.calculatePoints(activity.difficulty, activity.logicLevel),
      missions: activity.missions || this.getDefaultMissions(environment),
      maxBlocks: this.calculateMaxBlocks(activity.logicLevel),
      requiredHardware: this.getRequiredHardware(environment),
      allowedBlockTypes: this.getAllowedBlockTypes(environment),
      startingPosition: activity.startingPosition || { x: 0, z: 0 },
      targetPosition: activity.targetPosition || { x: 30, z: 0 },
    };
  }

  static adaptActivityResponse(
    activity: { idActivity: string; name: string },
    challengeData?: ActivityChallengeData
  ): AdaptedChallenge | null {
    if (!challengeData) {
      return null;
    }

    return this.adaptActivityToChallenge({
      ...challengeData,
      idActivity: activity.idActivity,
      name: activity.name,
    });
  }

  private static mapActivityEnvironment(
    environment?: string
  ): EnvironmentType {
    const envMap: Record<string, EnvironmentType> = {
      obstacle: "obstacle",
      maze: "maze",
      battle: "battle",
      space: "space",
      robotics: "obstacle",
      theoretical: "obstacle",
      quiz: "obstacle",
    };

    return envMap[environment || ""] || "obstacle";
  }

  private static mapDifficulty(
    difficulty?: string
  ): "EASY" | "MEDIUM" | "HARD" {
    const diffMap: Record<string, "EASY" | "MEDIUM" | "HARD"> = {
      EASY: "EASY",
      MEDIUM: "MEDIUM",
      HARD: "HARD",
      easy: "EASY",
      medium: "MEDIUM",
      hard: "HARD",
      facil: "EASY",
      medio: "MEDIUM",
      dificil: "HARD",
    };

    return diffMap[difficulty || ""] || "EASY";
  }

  private static calculatePoints(
    difficulty?: string,
    logicLevel?: number
  ): number {
    const basePoints: Record<string, number> = {
      EASY: 100,
      MEDIUM: 200,
      HARD: 300,
    };

    const base = basePoints[difficulty || "EASY"] || 100;
    const levelMultiplier = (logicLevel || 1) * 0.5;

    return Math.round(base * (1 + levelMultiplier));
  }

  private static calculateMaxBlocks(logicLevel?: number): number {
    const level = logicLevel || 1;
    return Math.min(20, 5 + level * 2);
  }

  private static getRequiredHardware(environment: EnvironmentType): string[] {
    const hardwareMap: Record<EnvironmentType, string[]> = {
      battle: ["Tracción Oruga", "Cañón Láser", "Sensor Ultrasónico"],
      space: ["Ruedas Lunares", "Propulsores Iónicos", "Brazo Recolector"],
      maze: ["Botas de Velocidad", "Faro Mágico", "Sensor Ultrasónico"],
      obstacle: ["Ruedas de Carrera", "Suspensión Deportiva", "Sensor de Velocidad"],
    };

    return hardwareMap[environment] || [];
  }

  private static getAllowedBlockTypes(environment: EnvironmentType): string[] {
    const blocksMap: Record<EnvironmentType, string[]> = {
      battle: [
        "al_iniciar_sistema",
        "mover_ruedas",
        "rotar_nucleo",
        "atacar",
        "defender",
        "escanear_enemigo",
        "retroceder",
        "golpear",
        "si_distancia",
        "repetir",
        "mientras",
        "por_cada",
      ],
      space: [
        "al_iniciar_sistema",
        "mover_ruedas",
        "rotar_nucleo",
        "despegar",
        "aterrizar",
        "recolectar",
        "analizar",
        "perforar",
        "si_distancia",
        "repetir",
        "mientras",
        "por_cada",
      ],
      maze: [
        "al_iniciar_sistema",
        "mover_ruedas",
        "rotar_nucleo",
        "iluminar",
        "abrir_puerta",
        "detectar_magia",
        "teletransportar",
        "congelar",
        "si_distancia",
        "repetir",
        "mientras",
        "por_cada",
      ],
      obstacle: [
        "al_iniciar_sistema",
        "mover_ruedas",
        "rotar_nucleo",
        "acelerar",
        "frenar",
        "saltar",
        "esquivar",
        "frenado_emergencia",
        "si_distancia",
        "repetir",
        "mientras",
        "por_cada",
      ],
    };

    return blocksMap[environment] || [];
  }

  private static getDefaultMissions(environment: EnvironmentType): MissionTemplate[] {
    const missionsMap: Record<EnvironmentType, MissionTemplate[]> = {
      battle: [
        { id: "b1", title: "Ensamblaje de Combate", objective: "Equipa las Orugas de Combate y el Cañón Láser.", maxBlocks: 0 },
        { id: "b2", title: "Patrullaje", objective: "Avanza 3 veces hacia la zona enemiga usando [AVANZAR].", maxBlocks: 3 },
        { id: "b3", title: "Ataque Sorpresa", objective: "Avanzar, usar [ATACAR] y retroceder. Máximo 4 bloques.", maxBlocks: 4 },
      ],
      space: [
        { id: "s1", title: "Aterrizaje", objective: "Equipa Ruedas Lunares y Propulsores. Despega y aterriza.", maxBlocks: 0 },
        { id: "s2", title: "Reconocimiento", objective: "Desplázate 2 veces hacia el cráter usando [DESPLAZARSE].", maxBlocks: 2 },
        { id: "s3", title: "Recolección", objective: "Avance, use [RECOLECTAR_MUESTRA] en zona de interés.", maxBlocks: 3 },
      ],
      maze: [
        { id: "m1", title: "Encender el Faro", objective: "Equipa Botas y Faro. Avanza y usa [ILUMINAR].", maxBlocks: 2 },
        { id: "m2", title: "Primera Puerta", objective: "Navega hasta la puerta y usa [ABRIR_PUERTA] para abrirla.", maxBlocks: 4 },
        { id: "m3", title: "Rastro Mágico", objective: "Usa [DETECTAR_MAGIA] para encontrar el camino correcto.", maxBlocks: 3 },
      ],
      obstacle: [
        { id: "o1", title: "Puesta a Punto", objective: "Equipa Ruedas de Carrera y Suspensión Deportiva.", maxBlocks: 0 },
        { id: "o2", title: "Curva Cerrada", objective: "Avanza y usa [GIRAR] para tomar la primera curva.", maxBlocks: 2 },
        { id: "o3", title: "Salto Mortal", objective: "Acelera y usa [SALTAR] para superar la rampa.", maxBlocks: 3 },
      ],
    };

    return missionsMap[environment] || [];
  }
}
