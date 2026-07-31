import type { EnvironmentType } from "../../../shared/types/Simulador";

export interface LevelObstacle {
  x: number;
  z: number;
  type: "wall" | "block" | "enemy" | "crate" | "sample" | "door" | "cone" | "chest" | "trap" | "ramp";
  size?: number;
}

export interface LevelConfig {
  id: string;
  name: string;
  description: string;
  objective: string;
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
  energyLimit?: number;
  targetCount?: number;
}

export const LEVEL_CONFIGS: Record<string, LevelConfig> = {
  // ===== 1. PRIMEROS PASOS (Battle) - Secuencialidad =====
  "n1": {
    id: "n1", name: "1. Primeros Pasos", environment: "battle",
    description: "Llega al beacon dorado.",
    objective: "Usa AVANZAR para llegar al objetivo",
    difficulty: 1, unlockStars: 0, maxBlocks: 3, goalRadius: 2.5,
    startPosition: { x: -15, z: -5, rotation: 0 },
    goalPosition: { x: 5, z: -5 },
    obstacles: [],
    availableBlocks: ["al_iniciar_sistema", "mover_ruedas"],
    requiredHardware: ["Tracción Oruga"],
  },

  // ===== 2. GIRA Y AVANZA (Space) - Secuencia + giro =====
  "n2": {
    id: "n2", name: "2. Gira y Avanza", environment: "space",
    description: "Esquiva el obstaculo y llega al beacon.",
    objective: "El camino esta bloqueado. Rodealo con GIRAR.",
    difficulty: 1, unlockStars: 1, maxBlocks: 5, goalRadius: 2.5,
    prevLevelId: "n1",
    startPosition: { x: -15, z: 0, rotation: 0 },
    goalPosition: { x: 5, z: 0 },
    obstacles: [{ x: -4, z: 0, type: "block", size: 2 }],
    availableBlocks: ["al_iniciar_sistema", "mover_ruedas", "rotar_nucleo"],
    requiredHardware: ["Ruedas Lunares"],
  },

  // ===== 3. REPITE CONMIGO (Battle) - Bucle REPETIR =====
  "n3": {
    id: "n3", name: "3. Repite Conmigo", environment: "battle",
    description: "Zigzag entre conos usando REPETIR.",
    objective: "Usa REPETIR(3) con AVANZAR y GIRAR para zigzaguear.",
    difficulty: 1, unlockStars: 1, maxBlocks: 8, goalRadius: 2.5,
    prevLevelId: "n2",
    startPosition: { x: -15, z: -5, rotation: 0 },
    goalPosition: { x: 10, z: -5 },
    obstacles: [
      { x: -8, z: -5, type: "cone" }, { x: -8, z: -3, type: "cone" },
      { x: -2, z: -5, type: "cone" }, { x: -2, z: -3, type: "cone" },
      { x: 4, z: -5, type: "cone" }, { x: 4, z: -3, type: "cone" },
    ],
    availableBlocks: ["al_iniciar_sistema", "mover_ruedas", "rotar_nucleo", "repetir"],
    requiredHardware: ["Tracción Oruga"],
  },

  // ===== 4. EL GUARDIAN (Battle) - Decisiones =====
  "n4": {
    id: "n4", name: "4. El Guardian", environment: "battle",
    description: "Un enemigo bloquea el camino. Rodealo o atacalo.",
    objective: "El enemigo cuida la salida. Como lo superas?",
    difficulty: 2, unlockStars: 2, maxBlocks: 10, goalRadius: 2.5,
    prevLevelId: "n3",
    startPosition: { x: -15, z: -5, rotation: 0 },
    goalPosition: { x: 8, z: -5 },
    obstacles: [{ x: -3, z: -5, type: "enemy", size: 1.5 }],
    availableBlocks: ["al_iniciar_sistema", "mover_ruedas", "rotar_nucleo", "repetir", "atacar", "si_distancia"],
    requiredHardware: ["Tracción Oruga", "Cañón Láser", "Sensor Ultrasónico"],
  },

  // ===== 5. PATRULLA (Space) - Bucles aplicados =====
  "n5": {
    id: "n5", name: "5. Patrulla", environment: "space",
    description: "Navega entre bloques en zigzag con REPETIR.",
    objective: "Usa REPETIR(4) con AVANZAR y GIRAR para zigzaguear.",
    difficulty: 2, unlockStars: 2, maxBlocks: 10, goalRadius: 2.5,
    prevLevelId: "n4",
    startPosition: { x: -18, z: 0, rotation: 0 },
    goalPosition: { x: 10, z: 0 },
    obstacles: [
      { x: -10, z: -3, type: "block", size: 1.5 }, { x: -10, z: 3, type: "block", size: 1.5 },
      { x: -4, z: -3, type: "block", size: 1.5 }, { x: -4, z: 3, type: "block", size: 1.5 },
      { x: 2, z: -3, type: "block", size: 1.5 }, { x: 2, z: 3, type: "block", size: 1.5 },
    ],
    availableBlocks: ["al_iniciar_sistema", "mover_ruedas", "rotar_nucleo", "repetir"],
    requiredHardware: ["Ruedas Lunares"],
  },

  // ===== 6. RECOLECTOR (Space) - Bucles + objetos =====
  "n6": {
    id: "n6", name: "6. Recolector", environment: "space",
    description: "Recoge 3 cristales esquivando rocas.",
    objective: "Recoge todos los cristales azules para completar.",
    difficulty: 2, unlockStars: 2, maxBlocks: 12, goalRadius: 2.5,
    prevLevelId: "n5",
    startPosition: { x: -18, z: 0, rotation: 0 },
    goalPosition: { x: 8, z: 0 },
    obstacles: [
      { x: -10, z: 0, type: "block", size: 1.5 },
      { x: -3, z: -4, type: "sample" }, { x: 2, z: 4, type: "sample" }, { x: -2, z: 0, type: "sample" },
    ],
    availableBlocks: ["al_iniciar_sistema", "mover_ruedas", "rotar_nucleo", "repetir", "recolectar"],
    requiredHardware: ["Ruedas Lunares", "Brazo Recolector"],
    targetCount: 3,
  },

  // ===== 7. EL PASILLO (Maze) - Condicional SI =====
  "n7": {
    id: "n7", name: "7. El Pasillo", environment: "maze",
    description: "Avanza por el pasillo y abre las puertas bloqueadas.",
    objective: "Usa ABRIR_PUERTA cuando encuentres una para avanzar.",
    difficulty: 2, unlockStars: 2, maxBlocks: 12, goalRadius: 2.5,
    prevLevelId: "n6",
    startPosition: { x: -15, z: 0, rotation: 0 },
    goalPosition: { x: 6, z: 0 },
    obstacles: [
      { x: -6, z: 0, type: "door" },
      { x: 0, z: 0, type: "door" },
      { x: -8, z: -3, type: "wall", size: 6 }, { x: 2, z: 3, type: "wall", size: 6 },
    ],
    availableBlocks: ["al_iniciar_sistema", "mover_ruedas", "rotar_nucleo", "repetir", "abrir_puerta", "iluminar"],
    requiredHardware: ["Botas de Velocidad", "Llave Antigua", "Faro Mágico"],
  },

  // ===== 8. ENERGIA LIMITADA (Maze) - Eficiencia =====
  "n8": {
    id: "n8", name: "8. Energia Limitada", environment: "maze",
    description: "Llega al templo con energia limitada. Cada movimiento consume energia.",
    objective: "Tienes 50% de energia. Encuentra la ruta mas corta.",
    difficulty: 3, unlockStars: 2, maxBlocks: 10, goalRadius: 2.5,
    prevLevelId: "n7",
    startPosition: { x: -15, z: 0, rotation: 0 },
    goalPosition: { x: 6, z: 0 },
    obstacles: [
      { x: -8, z: -2, type: "wall", size: 4 },
      { x: -2, z: 2, type: "wall", size: 5 },
      { x: 2, z: -3, type: "trap" },
      { x: 4, z: 2, type: "trap" },
    ],
    availableBlocks: ["al_iniciar_sistema", "mover_ruedas", "rotar_nucleo", "repetir"],
    requiredHardware: ["Botas de Velocidad"],
    energyLimit: 50,
  },

  // ===== 9. LABERINTO (Maze) - Resolucion de problemas =====
  "n9": {
    id: "n9", name: "9. Laberinto", environment: "maze",
    description: "Encuentra la salida del laberinto. Hay cofres con pistas.",
    objective: "Navega los pasillos. Cada cofre te da una pista.",
    difficulty: 3, unlockStars: 2, maxBlocks: 14, goalRadius: 2.5,
    prevLevelId: "n8",
    startPosition: { x: -14, z: 0, rotation: 0 },
    goalPosition: { x: 8, z: 0 },
    obstacles: [
      { x: -8, z: -4, type: "wall", size: 6 }, { x: -8, z: 3, type: "wall", size: 4 },
      { x: -3, z: -2, type: "wall", size: 4 }, { x: -3, z: 4, type: "wall", size: 3 },
      { x: 2, z: -4, type: "wall", size: 5 }, { x: 2, z: 2, type: "wall", size: 4 },
      { x: -6, z: -1, type: "chest" },
      { x: 0, z: 0, type: "door" },
      { x: 5, z: -1, type: "chest" },
    ],
    availableBlocks: ["al_iniciar_sistema", "mover_ruedas", "rotar_nucleo", "repetir", "abrir_puerta", "iluminar", "congelar"],
    requiredHardware: ["Botas de Velocidad", "Llave Antigua", "Faro Mágico", "Cristal de Escarcha"],
  },

  // ===== 10. CONTADOR (Battle) - Variables =====
  "n10": {
    id: "n10", name: "10. Contador", environment: "battle",
    description: "Derrota 5 enemigos usando el bloque CONTADOR.",
    objective: "Usa CONTADOR +1 para contar cuantos enemigos derrotaste.",
    difficulty: 3, unlockStars: 3, maxBlocks: 16, goalRadius: 2.5,
    prevLevelId: "n9",
    startPosition: { x: -15, z: -5, rotation: 0 },
    goalPosition: { x: 10, z: -5 },
    obstacles: [
      { x: -8, z: -5, type: "enemy" }, { x: -3, z: -2, type: "enemy" },
      { x: 2, z: -8, type: "enemy" }, { x: 5, z: -3, type: "enemy" }, { x: 8, z: -5, type: "enemy" },
    ],
    availableBlocks: ["al_iniciar_sistema", "mover_ruedas", "rotar_nucleo", "repetir", "atacar", "si_distancia", "contador"],
    requiredHardware: ["Tracción Oruga", "Cañón Láser", "Sensor Ultrasónico"],
    targetCount: 5,
  },

  // ===== 11. ESCAPE (Race) - Tiempo + presion =====
  "n11": {
    id: "n11", name: "11. Escape", environment: "obstacle",
    description: "Escapa del circuito antes de que las barreras te atrapen.",
    objective: "Completa el circuito usando el menor numero de bloques posible.",
    difficulty: 3, unlockStars: 3, maxBlocks: 10, goalRadius: 3,
    prevLevelId: "n10",
    startPosition: { x: -30, z: 0, rotation: 0 },
    goalPosition: { x: 20, z: 0 },
    obstacles: [
      { x: -20, z: -3, type: "cone" }, { x: -15, z: 4, type: "cone" },
      { x: -8, z: -4, type: "cone" }, { x: -2, z: 3, type: "cone" },
      { x: 5, z: -3, type: "cone" }, { x: 12, z: 4, type: "cone" },
    ],
    availableBlocks: ["al_iniciar_sistema", "mover_ruedas", "rotar_nucleo", "repetir", "esquivar", "acelerar"],
    requiredHardware: ["Ruedas de Carrera", "Alerones Activos", "Turbo Compresor"],
  },

  // ===== 12. CONSTRUCTOR (Space) - Creatividad =====
  "n12": {
    id: "n12", name: "12. Constructor", environment: "space",
    description: "Construye un camino rodeando los bloques para llegar a la meta.",
    objective: "No hay un solo camino. Disena tu propia ruta.",
    difficulty: 3, unlockStars: 3, maxBlocks: 16, goalRadius: 2.5,
    prevLevelId: "n11",
    startPosition: { x: -18, z: 0, rotation: 0 },
    goalPosition: { x: 10, z: 0 },
    obstacles: [
      { x: -12, z: -4, type: "block", size: 2 }, { x: -12, z: 4, type: "block", size: 2 },
      { x: -6, z: -2, type: "block", size: 2 }, { x: -6, z: 3, type: "block", size: 2 },
      { x: 0, z: -5, type: "block", size: 2 }, { x: 0, z: 5, type: "block", size: 2 },
      { x: 5, z: -3, type: "block", size: 2 }, { x: 5, z: 2, type: "block", size: 2 },
    ],
    availableBlocks: ["al_iniciar_sistema", "mover_ruedas", "rotar_nucleo", "repetir", "recolectar", "despegar", "aterrizar"],
    requiredHardware: ["Ruedas Lunares", "Brazo Recolector", "Propulsores Iónicos"],
  },

  // ===== 13. EL JEFE (Battle) - Todo combinado =====
  "n13": {
    id: "n13", name: "13. El Jefe", environment: "battle",
    description: "Derrota al jefe final. Combina todo lo aprendido.",
    objective: "El jefe tiene mucha vida. Usa REPETIR con ATACAR y DEFENDER.",
    difficulty: 3, unlockStars: 3, maxBlocks: 18, goalRadius: 2.5,
    prevLevelId: "n12",
    startPosition: { x: -15, z: -5, rotation: 0 },
    goalPosition: { x: 12, z: -5 },
    obstacles: [
      { x: -8, z: -5, type: "enemy" }, { x: -3, z: -2, type: "enemy" },
      { x: 3, z: -8, type: "enemy" }, { x: 0, z: -5, type: "block", size: 2 },
      { x: 8, z: -2, type: "enemy" },
    ],
    availableBlocks: ["al_iniciar_sistema", "mover_ruedas", "rotar_nucleo", "repetir", "atacar", "defender", "si_distancia", "contador"],
    requiredHardware: ["Tracción Oruga", "Cañón Láser", "Escudo Energético", "Sensor Ultrasónico"],
    targetCount: 4,
  },

  // ===== 14. CARRERA (Race) - Optimizacion =====
  "n14": {
    id: "n14", name: "14. Carrera", environment: "obstacle",
    description: "Completa el circuito en el menor numero de bloques posible.",
    objective: "Optimiza tu codigo. Menos bloques = mas estrellas.",
    difficulty: 3, unlockStars: 3, maxBlocks: 8, goalRadius: 3,
    prevLevelId: "n13",
    startPosition: { x: -30, z: 0, rotation: 0 },
    goalPosition: { x: 25, z: 0 },
    obstacles: [
      { x: -22, z: -4, type: "cone" }, { x: -18, z: 4, type: "cone" },
      { x: -12, z: -4, type: "cone" }, { x: -8, z: 4, type: "cone" },
      { x: -2, z: -4, type: "cone" }, { x: 2, z: 4, type: "cone" },
      { x: 8, z: -4, type: "cone" }, { x: 14, z: 4, type: "cone" },
      { x: 20, z: -3, type: "cone" },
    ],
    availableBlocks: ["al_iniciar_sistema", "mover_ruedas", "rotar_nucleo", "repetir", "esquivar", "acelerar", "frenar", "si_distancia"],
    requiredHardware: ["Ruedas de Carrera", "Alerones Activos", "Turbo Compresor", "Suspensión Deportiva"],
  },

  // ===== 15. MODO LIBRE (Race) - Creatividad sin limites =====
  "n15": {
    id: "n15", name: "15. Modo Libre", environment: "obstacle",
    description: "Sin restricciones. Crea tu propia aventura.",
    objective: "Todos los bloques y hardware disponible. Diviertete!",
    difficulty: 3, unlockStars: 3, maxBlocks: 99, goalRadius: 3,
    prevLevelId: "n14",
    startPosition: { x: -30, z: 0, rotation: 0 },
    goalPosition: { x: 25, z: 0 },
    obstacles: [
      { x: -20, z: -4, type: "cone" }, { x: -20, z: 4, type: "cone" },
      { x: -5, z: -4, type: "cone" }, { x: -5, z: 4, type: "cone" },
      { x: 10, z: -4, type: "cone" }, { x: 10, z: 4, type: "cone" },
    ],
    availableBlocks: ["al_iniciar_sistema", "mover_ruedas", "rotar_nucleo", "repetir", "mientras", "por_cada", "esquivar", "acelerar", "frenar", "si_distancia", "atacar", "contador"],
    requiredHardware: ["Ruedas de Carrera", "Alerones Activos", "Turbo Compresor", "Suspensión Deportiva", "Paracaídas de Frenado"],
  },
};

export function getLevelsForEnvironment(env: EnvironmentType): LevelConfig[] {
  return Object.values(LEVEL_CONFIGS).filter((l) => l.environment === env);
}

export function getLevelById(id: string): LevelConfig | undefined {
  return LEVEL_CONFIGS[id];
}
