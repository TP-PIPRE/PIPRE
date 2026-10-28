import { describe, expect, it } from "vitest";
import { NEONFLOW_LEVELS } from "../../src/shared/constants/levelConfigs";
import { raycast } from "../../src/application/usecases/neonflow/raycast";
import type { Cell, Grid } from "../../src/shared/types/NeonFlow";

const buildGrid = (level: (typeof NEONFLOW_LEVELS)[number]): Grid => {
  const cells: Cell[] = Array.from({ length: level.width * level.height }, (_, index) => ({
    x: index % level.width,
    y: Math.floor(index / level.width),
    type: "EMPTY",
  }));

  for (const blocked of level.blocked) {
    cells[blocked.y * level.width + blocked.x] = blocked;
  }

  for (const receptor of level.receptors) {
    cells[receptor.position.y * level.width + receptor.position.x] = {
      ...receptor.position,
      color: receptor.color,
    };
  }

  for (const placement of level.solution ?? []) {
    const index = placement.position.y * level.width + placement.position.x;
    cells[index] = {
      ...placement.position,
      type: placement.type,
      color: placement.color,
      rotation: placement.rotation,
    };
  }

  return { width: level.width, height: level.height, cells };
};

describe("NeonFlow levels", () => {
  it("contains 30 progressive levels with the GDD board sizes", () => {
    expect(NEONFLOW_LEVELS).toHaveLength(30);
    expect(NEONFLOW_LEVELS.slice(0, 10).every((level) => level.width === 4 && level.height === 4)).toBe(true);
    expect(NEONFLOW_LEVELS.slice(10, 20).every((level) => level.width === 5 && level.height === 5)).toBe(true);
    expect(NEONFLOW_LEVELS.slice(20).every((level) => level.width === 6 && level.height === 6)).toBe(true);
  });

  it.each(NEONFLOW_LEVELS.map((level) => [level.level, level] as const))(
    "solves level %i with its configured solution",
    (_levelNumber, level) => {
      const path = raycast(
        buildGrid(level),
        level.emitter.position,
        level.emitter.direction,
        level.emitter.color,
      );

      expect(level.receptors.every((receptor) =>
        path.some((cell) => cell.x === receptor.position.x && cell.y === receptor.position.y),
      )).toBe(true);
    },
  );
});
