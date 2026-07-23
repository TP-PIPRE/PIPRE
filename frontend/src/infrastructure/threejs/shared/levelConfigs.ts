import type { EnvironmentType } from "../../../shared/types/Simulador";

export interface LevelObstacle {
  x: number;
  z: number;
  type: "wall" | "block" | "enemy" | "crate" | "sample" | "door" | "cone";
  size?: number;
}

export interface LevelConfig {
  id: string;
  name: string;
  description: string;
  difficulty: 1 | 2 | 3;
  environment: EnvironmentType;
  startPosition: { x: number; z: number; rotation: number };
  goalPosition: { x: number; z: number };
  goalRadius: number;
  obstacles: LevelObstacle[];
  availableBlocks: string[];
  requiredHardware: string[];
  maxBlocks: number;
  unlockStars: number;
  prevLevelId?: string;
}

export const LEVEL_CONFIGS: Record<string, LevelConfig> = {
  // ====== BATTLE (Batalla de Robots) ======
  "battle-1": {
    id: "battle-1",
    name: "Primer paso",
    description: "Avanza en linea recta hasta el objetivo. Sin enemigos.",
    difficulty: 1,
    environment: "battle",
    startPosition: { x: -15, z: -5, rotation: 0 },
    goalPosition: { x: 5, z: -5 },
    goalRadius: 2,
    obstacles: [],
    availableBlocks: ["al_iniciar_sistema", "mover_ruedas", "rotar_nucleo"],
    requiredHardware: ["Tracción Oruga"],
    maxBlocks: 4,
    unlockStars: 0,
  },
  "battle-2": {
    id: "battle-2",
    name: "Esquivar al enemigo",
    description: "Rodea al enemigo usando GIRO y AVANZAR. No hace falta atacar.",
    difficulty: 2,
    environment: "battle",
    startPosition: { x: -15, z: -5, rotation: 0 },
    goalPosition: { x: 5, z: -5 },
    goalRadius: 2,
    obstacles: [
      { x: -5, z: -5, type: "enemy", size: 1.5 },
    ],
    availableBlocks: ["al_iniciar_sistema", "mover_ruedas", "rotar_nucleo", "repetir"],
    requiredHardware: ["Tracción Oruga", "Sensor Ultrasónico"],
    maxBlocks: 8,
    unlockStars: 1,
    prevLevelId: "battle-1",
  },
  "battle-3": {
    id: "battle-3",
    name: "Patrulla de combate",
    description: "Usa REPETIR para eliminar a 3 enemigos en zigzag y llegar a la meta.",
    difficulty: 3,
    environment: "battle",
    startPosition: { x: -15, z: -5, rotation: 0 },
    goalPosition: { x: 8, z: -5 },
    goalRadius: 2,
    obstacles: [
      { x: -8, z: -5, type: "enemy" },
      { x: -2, z: -2, type: "enemy" },
      { x: 3, z: -8, type: "enemy" },
    ],
    availableBlocks: ["al_iniciar_sistema", "mover_ruedas", "rotar_nucleo", "repetir", "atacar", "si_distancia"],
    requiredHardware: ["Tracción Oruga", "Cañón Láser", "Sensor Ultrasónico"],
    maxBlocks: 14,
    unlockStars: 2,
    prevLevelId: "battle-2",
  },

  // ====== SPACE (Exploración Espacial) ======
  "space-1": {
    id: "space-1",
    name: "Aterrizaje suave",
    description: "Avanza en linea recta hacia la plataforma de aterrizaje.",
    difficulty: 1,
    environment: "space",
    startPosition: { x: -15, z: 0, rotation: 0 },
    goalPosition: { x: 5, z: 0 },
    goalRadius: 2.5,
    obstacles: [],
    availableBlocks: ["al_iniciar_sistema", "mover_ruedas", "rotar_nucleo"],
    requiredHardware: ["Ruedas Lunares"],
    maxBlocks: 4,
    unlockStars: 0,
  },
  "space-2": {
    id: "space-2",
    name: "Recoleccion de muestras",
    description: "Rodea los crateres y recolecta la muestra. Usa REPETIR.",
    difficulty: 2,
    environment: "space",
    startPosition: { x: -15, z: 0, rotation: 0 },
    goalPosition: { x: 5, z: 0 },
    goalRadius: 2.5,
    obstacles: [
      { x: -8, z: 0, type: "block", size: 2 },
      { x: -3, z: -3, type: "sample" },
    ],
    availableBlocks: ["al_iniciar_sistema", "mover_ruedas", "rotar_nucleo", "repetir", "recolectar"],
    requiredHardware: ["Ruedas Lunares", "Brazo Recolector"],
    maxBlocks: 8,
    unlockStars: 1,
    prevLevelId: "space-1",
  },
  "space-3": {
    id: "space-3",
    name: "Mapeo sistematico",
    description: "Explora en zigzag, recolecta 3 muestras. Usa REPETIR anidados.",
    difficulty: 3,
    environment: "space",
    startPosition: { x: -15, z: 0, rotation: 0 },
    goalPosition: { x: 8, z: 0 },
    goalRadius: 2.5,
    obstacles: [
      { x: -8, z: -3, type: "sample" },
      { x: -3, z: 3, type: "sample" },
      { x: 2, z: -3, type: "sample" },
      { x: -5, z: 0, type: "block", size: 1.5 },
    ],
    availableBlocks: ["al_iniciar_sistema", "mover_ruedas", "rotar_nucleo", "repetir", "recolectar", "analizar"],
    requiredHardware: ["Ruedas Lunares", "Brazo Recolector", "Analizador de Suelo"],
    maxBlocks: 14,
    unlockStars: 2,
    prevLevelId: "space-2",
  },

  // ====== MAZE (Laberinto Mágico) ======
  "maze-1": {
    id: "maze-1",
    name: "Encender el faro",
    description: "Avanza hacia la puerta e iluminala para abrirla.",
    difficulty: 1,
    environment: "maze",
    startPosition: { x: -12, z: 0, rotation: 0 },
    goalPosition: { x: 4, z: 0 },
    goalRadius: 2,
    obstacles: [
      { x: -2, z: -4, type: "wall", size: 8 },
      { x: -2, z: 4, type: "wall", size: 8 },
    ],
    availableBlocks: ["al_iniciar_sistema", "mover_ruedas", "iluminar"],
    requiredHardware: ["Botas de Velocidad", "Faro Mágico"],
    maxBlocks: 4,
    unlockStars: 0,
  },
  "maze-2": {
    id: "maze-2",
    name: "Corredor encantado",
    description: "Navega el pasillo en zigzag usando REPETIR. Ilumina en cada esquina.",
    difficulty: 2,
    environment: "maze",
    startPosition: { x: -12, z: 0, rotation: 0 },
    goalPosition: { x: 6, z: 0 },
    goalRadius: 2,
    obstacles: [
      { x: -4, z: -4, type: "door" },
      { x: 0, z: 3, type: "wall", size: 6 },
      { x: 2, z: -3, type: "door" },
    ],
    availableBlocks: ["al_iniciar_sistema", "mover_ruedas", "rotar_nucleo", "repetir", "iluminar", "abrir_puerta"],
    requiredHardware: ["Botas de Velocidad", "Faro Mágico", "Llave Antigua"],
    maxBlocks: 10,
    unlockStars: 1,
    prevLevelId: "maze-1",
  },
  "maze-3": {
    id: "maze-3",
    name: "Portal magico",
    description: "Abre 2 puertas, teletransportate al portal y llega a la salida. Usa REPETIR.",
    difficulty: 3,
    environment: "maze",
    startPosition: { x: -12, z: 0, rotation: 0 },
    goalPosition: { x: 8, z: 0 },
    goalRadius: 2,
    obstacles: [
      { x: -4, z: -3, type: "door" },
      { x: 2, z: 2, type: "door" },
      { x: 6, z: -4, type: "wall", size: 5 },
      { x: -1, z: 0, type: "block", size: 1 },
    ],
    availableBlocks: ["al_iniciar_sistema", "mover_ruedas", "rotar_nucleo", "repetir", "iluminar", "abrir_puerta", "teletransportar", "congelar"],
    requiredHardware: ["Botas de Velocidad", "Faro Mágico", "Llave Antigua", "Portal de Teletransporte", "Cristal de Escarcha"],
    maxBlocks: 14,
    unlockStars: 2,
    prevLevelId: "maze-2",
  },

  // ====== OBSTACLE (Carrera de Obstáculos) ======
  "obstacle-1": {
    id: "obstacle-1",
    name: "Recta de aceleracion",
    description: "Avanza en linea recta pasando los conos hasta la meta.",
    difficulty: 1,
    environment: "obstacle",
    startPosition: { x: -25, z: 0, rotation: 0 },
    goalPosition: { x: 15, z: 0 },
    goalRadius: 3,
    obstacles: [
      { x: -15, z: -3, type: "cone" },
      { x: -15, z: 3, type: "cone" },
      { x: -5, z: -3, type: "cone" },
      { x: -5, z: 3, type: "cone" },
    ],
    availableBlocks: ["al_iniciar_sistema", "mover_ruedas"],
    requiredHardware: ["Ruedas de Carrera"],
    maxBlocks: 3,
    unlockStars: 0,
  },
  "obstacle-2": {
    id: "obstacle-2",
    name: "Eslalon ritmico",
    description: "Esquiva conos en zigzag usando GIRO y AVANZAR. Usa REPETIR.",
    difficulty: 2,
    environment: "obstacle",
    startPosition: { x: -25, z: 0, rotation: 0 },
    goalPosition: { x: 15, z: 0 },
    goalRadius: 3,
    obstacles: [
      { x: -18, z: -4, type: "cone" },
      { x: -15, z: 4, type: "cone" },
      { x: -10, z: -4, type: "cone" },
      { x: -7, z: 4, type: "cone" },
      { x: -2, z: -4, type: "cone" },
      { x: 3, z: 4, type: "cone" },
      { x: 8, z: -4, type: "cone" },
    ],
    availableBlocks: ["al_iniciar_sistema", "mover_ruedas", "rotar_nucleo", "repetir", "esquivar"],
    requiredHardware: ["Ruedas de Carrera", "Alerones Activos"],
    maxBlocks: 12,
    unlockStars: 1,
    prevLevelId: "obstacle-1",
  },
  "obstacle-3": {
    id: "obstacle-3",
    name: "Contrarreloj extremo",
    description: "Alterna ACELERAR y ESQUIVAR para sortear los conos. Usa REPETIR con condicional.",
    difficulty: 3,
    environment: "obstacle",
    startPosition: { x: -25, z: 0, rotation: 0 },
    goalPosition: { x: 18, z: 0 },
    goalRadius: 3,
    obstacles: [
      { x: -20, z: 3, type: "cone" },
      { x: -16, z: -4, type: "cone" },
      { x: -12, z: 2, type: "cone" },
      { x: -8, z: -4, type: "cone" },
      { x: -4, z: 3, type: "cone" },
      { x: 0, z: -4, type: "cone" },
      { x: 4, z: 2, type: "cone" },
      { x: 8, z: -4, type: "cone" },
      { x: 12, z: 3, type: "cone" },
    ],
    availableBlocks: ["al_iniciar_sistema", "mover_ruedas", "rotar_nucleo", "repetir", "esquivar", "acelerar", "frenar", "si_distancia"],
    requiredHardware: ["Ruedas de Carrera", "Alerones Activos", "Turbo Compresor", "Suspensión Deportiva"],
    maxBlocks: 16,
    unlockStars: 2,
    prevLevelId: "obstacle-2",
  },
};

export function getLevelsForEnvironment(env: EnvironmentType): LevelConfig[] {
  return Object.values(LEVEL_CONFIGS).filter((l) => l.environment === env);
}

export function getLevelById(id: string): LevelConfig | undefined {
  return LEVEL_CONFIGS[id];
}
