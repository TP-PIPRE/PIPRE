import type { EnvironmentType } from "../../shared/types/Simulador";

export type StagePattern = "LINEAL" | "ESPIRAL" | "SERPENTINA" | "CRUCE" | "LABERINTO";

export interface StageCell {
  x: number;
  z: number;
  type: "empty" | "wall" | "start" | "target" | "waypoint" | "collectible" | "obstacle";
  label?: string;
}

export interface StageLayout {
  pattern: StagePattern;
  cells: StageCell[];
  gridWidth: number;
  gridDepth: number;
  startPosition: { x: number; z: number };
  targetPosition: { x: number; z: number };
  waypoints: { x: number; z: number; label: string }[];
  collectibles: { x: number; z: number }[];
  obstacles: { x: number; z: number; width: number; depth: number }[];
  iterationHint: string;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateLineal(difficulty: "EASY" | "MEDIUM" | "HARD", _totalMissions: number, missionIndex: number): StageLayout {
  const length = 20 + missionIndex * 10 + (difficulty === "HARD" ? 10 : 0);
  const cells: StageCell[] = [];
  const obstacles: StageLayout["obstacles"] = [];

  const startPos = { x: 0, z: 0 };
  const targetPos = { x: length, z: 0 };

  cells.push({ x: 0, z: 0, type: "start" });
  cells.push({ x: length, z: 0, type: "target", label: "Meta" });

  const waypointCount = difficulty === "HARD" ? 3 : difficulty === "MEDIUM" ? 2 : 1;
  const waypoints: StageLayout["waypoints"] = [];
  for (let i = 0; i < waypointCount; i++) {
    const wx = Math.round(length * (i + 1) / (waypointCount + 1));
    cells.push({ x: wx, z: 0, type: "waypoint", label: `Paso ${i + 1}` });
    waypoints.push({ x: wx, z: 0, label: `Paso ${i + 1}` });
  }

  if (difficulty !== "EASY") {
    for (let i = 0; i < missionIndex + 1; i++) {
      const ox = randInt(5, length - 5);
      obstacles.push({ x: ox, z: -3, width: 4, depth: 4 });
      cells.push({ x: ox, z: -3, type: "obstacle" });
    }
  }

  return {
    pattern: "LINEAL",
    cells,
    gridWidth: length + 10,
    gridDepth: 10,
    startPosition: startPos,
    targetPosition: targetPos,
    waypoints,
    collectibles: [],
    obstacles,
    iterationHint: `Repetir AVANZAR varias veces en línea recta`,
  };
}

function generateSerpentina(difficulty: "EASY" | "MEDIUM" | "HARD", _totalMissions: number, missionIndex: number): StageLayout {
  const segments = 3 + missionIndex;
  const step = 5 + (difficulty === "HARD" ? 3 : 0);
  const cells: StageCell[] = [];
  const waypoints: StageLayout["waypoints"] = [];
  const obstacles: StageLayout["obstacles"] = [];
  const collectibles: StageLayout["collectibles"] = [];

  const startPos = { x: 0, z: 0 };
  let cx = 0, cz = 0;
  let dir = 1;

  cells.push({ x: 0, z: 0, type: "start" });

  for (let i = 0; i < segments; i++) {
    cx += step;
    cells.push({ x: cx, z: cz, type: "waypoint", label: `Curva ${i + 1}` });
    waypoints.push({ x: cx, z: cz, label: `Curva ${i + 1}` });
    cz += step * dir;
    cells.push({ x: cx, z: cz, type: "waypoint" });
    waypoints.push({ x: cx, z: cz, label: `Giro ${i + 1}` });
    if (i % 2 === 0 && i > 0) {
      collectibles.push({ x: cx, z: cz });
    }
    dir *= -1;
  }

  cells.push({ x: cx, z: cz, type: "target", label: "Meta" });
  const targetPos = { x: cx, z: cz };

  return {
    pattern: "SERPENTINA",
    cells,
    gridWidth: cx + 10,
    gridDepth: Math.abs(cz) + 10,
    startPosition: startPos,
    targetPosition: targetPos,
    waypoints,
    collectibles,
    obstacles,
    iterationHint: `Alternar AVANZAR y GIRAR en patrón zigzag (${segments} segmentos)`,
  };
}

function generateEspiral(_difficulty: "EASY" | "MEDIUM" | "HARD", _totalMissions: number, missionIndex: number): StageLayout {
  const vueltas = 2 + missionIndex;
  const cells: StageCell[] = [];
  const waypoints: StageLayout["waypoints"] = [];
  const obstacles: StageLayout["obstacles"] = [];
  const collectibles: StageLayout["collectibles"] = [];

  const startPos = { x: 0, z: 0 };
  cells.push({ x: 0, z: 0, type: "start" });

  let cx = 0, cz = 0;
  const dirs = [
    [1, 0], [0, 1], [-1, 0], [0, -1]
  ];

  for (let v = 0; v < vueltas; v++) {
    for (let d = 0; d < 4; d++) {
      const len = (v * 2 + d + 1) * 3;
      for (let s = 0; s < len; s++) {
        cx += dirs[d][0];
        cz += dirs[d][1];
        if (s === len - 1) {
          cells.push({ x: cx, z: cz, type: "waypoint", label: `Vuelta ${v + 1}-${d + 1}` });
          waypoints.push({ x: cx, z: cz, label: `Vuelta ${v + 1}` });
        }
        if (s === Math.floor(len / 2)) {
          collectibles.push({ x: cx, z: cz });
        }
      }
    }
  }

  cells.push({ x: cx, z: cz, type: "target", label: "Meta" });
  const targetPos = { x: cx, z: cz };

  return {
    pattern: "ESPIRAL",
    cells,
    gridWidth: cx + 10,
    gridDepth: cz + 10,
    startPosition: startPos,
    targetPosition: targetPos,
    waypoints,
    collectibles,
    obstacles,
    iterationHint: `Repetir patrón AVANZAR+GIRAR en espiral (${vueltas} vueltas)`,
  };
}

function generateCruce(_difficulty: "EASY" | "MEDIUM" | "HARD", _totalMissions: number, missionIndex: number): StageLayout {
  const cells: StageCell[] = [];
  const waypoints: StageLayout["waypoints"] = [];
  const obstacles: StageLayout["obstacles"] = [];
  const collectibles: StageLayout["collectibles"] = [];

  const startPos = { x: -10, z: 0 };
  cells.push({ x: -10, z: 0, type: "start" });

  const branches = 2 + missionIndex;
  for (let b = 0; b < branches; b++) {
    const angle = (b / branches) * Math.PI * 2;
    const bx = Math.round(Math.cos(angle) * 8);
    const bz = Math.round(Math.sin(angle) * 8);
    cells.push({ x: bx, z: bz, type: "waypoint", label: `Rama ${b + 1}` });
    waypoints.push({ x: bx, z: bz, label: `Rama ${b + 1}` });
    collectibles.push({ x: bx, z: bz });
  }

  const targetPos = { x: 10, z: 0 };
  cells.push({ x: 10, z: 0, type: "target", label: "Meta" });

  return {
    pattern: "CRUCE",
    cells,
    gridWidth: 25,
    gridDepth: 15,
    startPosition: startPos,
    targetPosition: targetPos,
    waypoints,
    collectibles,
    obstacles,
    iterationHint: `Usar SI_DISTANCIA y MIENTRAS para navegar entre ${branches} ramas`,
  };
}

function generateLaberinto(_difficulty: "EASY" | "MEDIUM" | "HARD", _totalMissions: number, missionIndex: number): StageLayout {
  const size = 6 + missionIndex * 2;
  const cells: StageCell[] = [];
  const waypoints: StageLayout["waypoints"] = [];
  const obstacles: StageLayout["obstacles"] = [];
  const collectibles: StageLayout["collectibles"] = [];

  const startPos = { x: 0, z: 0 };
  cells.push({ x: 0, z: 0, type: "start" });

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (i === 0 || i === size - 1 || j === 0 || j === size - 1 || (i % 2 === 0 && j % 2 === 0)) {
        if (i === 0 && j === 0) continue;
        if (i === size - 1 && j === size - 1) {
          cells.push({ x: j, z: i, type: "target", label: "Salida" });
        } else {
          const isWall = Math.random() > 0.4;
          cells.push({ x: j, z: i, type: isWall ? "wall" : "empty" });
          if (isWall) {
            obstacles.push({ x: j, z: i, width: 2, depth: 2 });
          }
        }
      } else if (Math.random() > 0.6) {
        cells.push({ x: j, z: i, type: "waypoint", label: `P${i}-${j}` });
        waypoints.push({ x: j, z: i, label: `P${i}-${j}` });
      }
      if (Math.random() > 0.8) {
        collectibles.push({ x: j, z: i });
      }
    }
  }

  const targetPos = { x: size - 1, z: size - 1 };

  return {
    pattern: "LABERINTO",
    cells,
    gridWidth: size,
    gridDepth: size,
    startPosition: startPos,
    targetPosition: targetPos,
    waypoints,
    collectibles,
    obstacles,
    iterationHint: `Navegar usando bucles MIENTRAS con sensores de distancia en laberinto ${size}x${size}`,
  };
}

export function generateStage(
  _environment: EnvironmentType,
  difficulty: "EASY" | "MEDIUM" | "HARD",
  totalMissions: number,
  missionIndex: number,
  preferredPattern?: StagePattern
): StageLayout {
  const pattern = preferredPattern || ["LINEAL", "SERPENTINA", "ESPIRAL", "CRUCE", "LABERINTO"][missionIndex % 5] as StagePattern;

  switch (pattern) {
    case "LINEAL":
      return generateLineal(difficulty, totalMissions, missionIndex);
    case "SERPENTINA":
      return generateSerpentina(difficulty, totalMissions, missionIndex);
    case "ESPIRAL":
      return generateEspiral(difficulty, totalMissions, missionIndex);
    case "CRUCE":
      return generateCruce(difficulty, totalMissions, missionIndex);
    case "LABERINTO":
      return generateLaberinto(difficulty, totalMissions, missionIndex);
    default:
      return generateLineal(difficulty, totalMissions, missionIndex);
  }
}
