import type { Cell, Direction, NeonFlowLevelConfig, NeonFlowPlacement, RotationAngle } from "../frontend/src/shared/types/NeonFlow";

type Point = { x: number; y: number };

const cell = (point: Point, type: Cell["type"]): Cell => ({ ...point, type });

const directionBetween = (from: Point, to: Point): Direction => ({
  dx: Math.sign(to.x - from.x) as -1 | 0 | 1,
  dy: Math.sign(to.y - from.y) as -1 | 0 | 1,
});

const reflected = (direction: Direction, rotation: RotationAngle): Direction => {
  const slash = rotation % 180 === 0;
  return slash
    ? { dx: (-direction.dy) as -1 | 0 | 1, dy: (-direction.dx) as -1 | 0 | 1 }
    : { dx: direction.dy, dy: direction.dx };
};

const mirrorRotation = (incoming: Direction, outgoing: Direction): RotationAngle => {
  const rotation = ([0, 90, 180, 270] as RotationAngle[]).find((candidate) => {
    const result = reflected(incoming, candidate);
    return result.dx === outgoing.dx && result.dy === outgoing.dy;
  });
  if (rotation === undefined) {
    throw new Error("La ruta de Neon Flow contiene un giro no válido.");
  }
  return rotation;
};

const makeRoutedLevel = (
  level: number,
  width: number,
  height: number,
  route: Point[],
  color: string,
  blocked: Point[] = [],
  filterAt?: Point,
): NeonFlowLevelConfig => {
  const solution: NeonFlowPlacement[] = [];

  for (let index = 1; index < route.length - 1; index += 1) {
    const incoming = directionBetween(route[index - 1], route[index]);
    const outgoing = directionBetween(route[index], route[index + 1]);
    if (incoming.dx !== outgoing.dx || incoming.dy !== outgoing.dy) {
      solution.push({
        position: route[index],
        type: "MIRROR_90",
        rotation: mirrorRotation(incoming, outgoing),
      });
    }
  }

  if (filterAt) {
    solution.push({ position: filterAt, type: "FILTER", color });
  }

  return {
    level,
    width,
    height,
    blocked: blocked
      .filter((point) => !route.some((pathPoint) => pathPoint.x === point.x && pathPoint.y === point.y))
      .map((point) => cell(point, "BLOCK")),
    receptors: [{ position: cell(route[route.length - 1], "RECEPTOR"), color }],
    emitter: {
      position: cell(route[0], "EMPTY"),
      direction: directionBetween(route[0], route[1]),
      color,
    },
    solution,
  };
};

const levelOne: NeonFlowLevelConfig = {
  level: 1,
  width: 4,
  height: 4,
  blocked: [
    { x: 0, y: 0, type: "BLOCK" },
    { x: 3, y: 0, type: "BLOCK" },
    { x: 0, y: 3, type: "BLOCK" },
    { x: 3, y: 3, type: "BLOCK" },
  ],
  receptors: [{ position: { x: 3, y: 2, type: "RECEPTOR" }, color: "red" }],
  emitter: { position: { x: 0, y: 2, type: "EMPTY" }, direction: { dx: 1, dy: 0 }, color: "red" },
  solution: [],
};

const levelTwo: NeonFlowLevelConfig = {
  level: 2,
  width: 4,
  height: 4,
  blocked: [{ x: 2, y: 2, type: "BLOCK" }, { x: 2, y: 3, type: "BLOCK" }],
  receptors: [{ position: { x: 3, y: 0, type: "RECEPTOR" }, color: "red" }],
  emitter: { position: { x: 0, y: 2, type: "EMPTY" }, direction: { dx: 1, dy: 0 }, color: "red" },
  solution: [
    { position: { x: 1, y: 2 }, type: "MIRROR_90", rotation: 0 },
    { position: { x: 1, y: 0 }, type: "MIRROR_90", rotation: 0 },
  ],
};

export const NEONFLOW_LEVELS: NeonFlowLevelConfig[] = [
  levelOne,
  levelTwo,
  makeRoutedLevel(3, 4, 4, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 2 }, { x: 3, y: 2 }], "red", [{ x: 3, y: 0 }]),
  makeRoutedLevel(4, 4, 4, [{ x: 0, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 3 }, { x: 3, y: 3 }], "green", [{ x: 0, y: 3 }], { x: 1, y: 1 }),
  makeRoutedLevel(5, 4, 4, [{ x: 0, y: 2 }, { x: 1, y: 2 }, { x: 1, y: 0 }, { x: 3, y: 0 }], "blue", [{ x: 3, y: 2 }]),
  makeRoutedLevel(6, 4, 4, [{ x: 0, y: 3 }, { x: 2, y: 3 }, { x: 2, y: 1 }, { x: 3, y: 1 }], "red", [{ x: 0, y: 1 }], { x: 1, y: 3 }),
  makeRoutedLevel(7, 4, 4, [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 2 }, { x: 3, y: 2 }], "green", [{ x: 0, y: 2 }]),
  makeRoutedLevel(8, 4, 4, [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 3 }, { x: 3, y: 3 }], "blue", [{ x: 3, y: 1 }], { x: 1, y: 2 }),
  makeRoutedLevel(9, 4, 4, [{ x: 0, y: 2 }, { x: 2, y: 2 }, { x: 2, y: 0 }, { x: 3, y: 0 }], "red", [{ x: 0, y: 0 }]),
  makeRoutedLevel(10, 4, 4, [{ x: 0, y: 3 }, { x: 1, y: 3 }, { x: 1, y: 1 }, { x: 3, y: 1 }], "green", [{ x: 3, y: 3 }], { x: 1, y: 2 }),
  makeRoutedLevel(11, 5, 5, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 3 }, { x: 4, y: 3 }], "blue", [{ x: 4, y: 0 }, { x: 0, y: 4 }]),
  makeRoutedLevel(12, 5, 5, [{ x: 0, y: 1 }, { x: 3, y: 1 }, { x: 3, y: 4 }, { x: 4, y: 4 }], "red", [{ x: 0, y: 3 }], { x: 2, y: 1 }),
  makeRoutedLevel(13, 5, 5, [{ x: 0, y: 2 }, { x: 1, y: 2 }, { x: 1, y: 0 }, { x: 4, y: 0 }], "green", [{ x: 4, y: 2 }]),
  makeRoutedLevel(14, 5, 5, [{ x: 0, y: 3 }, { x: 2, y: 3 }, { x: 2, y: 1 }, { x: 4, y: 1 }], "blue", [{ x: 0, y: 1 }], { x: 1, y: 3 }),
  makeRoutedLevel(15, 5, 5, [{ x: 0, y: 4 }, { x: 3, y: 4 }, { x: 3, y: 2 }, { x: 4, y: 2 }], "red", [{ x: 4, y: 4 }]),
  makeRoutedLevel(16, 5, 5, [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 4 }, { x: 4, y: 4 }], "green", [{ x: 0, y: 4 }], { x: 1, y: 0 }),
  makeRoutedLevel(17, 5, 5, [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 3 }, { x: 4, y: 3 }], "blue", [{ x: 4, y: 1 }]),
  makeRoutedLevel(18, 5, 5, [{ x: 0, y: 2 }, { x: 3, y: 2 }, { x: 3, y: 0 }, { x: 4, y: 0 }], "red", [{ x: 0, y: 0 }], { x: 2, y: 2 }),
  makeRoutedLevel(19, 5, 5, [{ x: 0, y: 3 }, { x: 1, y: 3 }, { x: 1, y: 1 }, { x: 4, y: 1 }], "green", [{ x: 4, y: 3 }]),
  makeRoutedLevel(20, 5, 5, [{ x: 0, y: 4 }, { x: 2, y: 4 }, { x: 2, y: 2 }, { x: 4, y: 2 }], "blue", [{ x: 0, y: 2 }], { x: 1, y: 4 }),
  makeRoutedLevel(21, 6, 6, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 4 }, { x: 4, y: 4 }, { x: 4, y: 5 }], "red", [{ x: 5, y: 0 }, { x: 0, y: 5 }]),
  makeRoutedLevel(22, 6, 6, [{ x: 0, y: 1 }, { x: 3, y: 1 }, { x: 3, y: 5 }, { x: 5, y: 5 }], "green", [{ x: 0, y: 4 }], { x: 2, y: 1 }),
  makeRoutedLevel(23, 6, 6, [{ x: 0, y: 2 }, { x: 1, y: 2 }, { x: 1, y: 0 }, { x: 5, y: 0 }], "blue", [{ x: 5, y: 2 }]),
  makeRoutedLevel(24, 6, 6, [{ x: 0, y: 3 }, { x: 4, y: 3 }, { x: 4, y: 1 }, { x: 5, y: 1 }], "red", [{ x: 0, y: 1 }], { x: 2, y: 3 }),
  makeRoutedLevel(25, 6, 6, [{ x: 0, y: 4 }, { x: 2, y: 4 }, { x: 2, y: 2 }, { x: 5, y: 2 }], "green", [{ x: 5, y: 4 }]),
  makeRoutedLevel(26, 6, 6, [{ x: 0, y: 5 }, { x: 1, y: 5 }, { x: 1, y: 3 }, { x: 5, y: 3 }], "blue", [{ x: 0, y: 3 }], { x: 2, y: 3 }),
  makeRoutedLevel(27, 6, 6, [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 5, y: 4 }], "red", [{ x: 0, y: 4 }]),
  makeRoutedLevel(28, 6, 6, [{ x: 0, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 5 }, { x: 5, y: 5 }], "green", [{ x: 5, y: 1 }], { x: 1, y: 1 }),
  makeRoutedLevel(29, 6, 6, [{ x: 0, y: 2 }, { x: 3, y: 2 }, { x: 3, y: 0 }, { x: 5, y: 0 }], "blue", [{ x: 0, y: 0 }]),
  makeRoutedLevel(30, 6, 6, [{ x: 0, y: 3 }, { x: 1, y: 3 }, { x: 1, y: 5 }, { x: 5, y: 5 }], "red", [{ x: 5, y: 3 }], { x: 1, y: 4 }),
];
