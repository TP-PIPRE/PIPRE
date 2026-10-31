import { describe, expect, it } from "vitest";
import { NEONFLOW_LEVELS } from "../../src/shared/constants/levelConfigs";
import { raycast } from "../../src/application/usecases/neonflow/raycast";
import type { Cell, Grid } from "../../src/shared/types/NeonFlow";

import witnesses from "../fixtures/neonFlowSolutions.json";
import { createNeonGrid, neonSolved } from "../../src/application/usecases/neonflow/board";
const buildGrid = (level:(typeof NEONFLOW_LEVELS)[number]):Grid => {
  const grid=createNeonGrid(level);
  for(const placement of witnesses.find(w=>w.templateId===level.templateId)!.placements) {
    grid.cells[placement.position.y*level.width+placement.position.x]={...placement.position,type:placement.type as Cell['type'],...(placement.color?{color:placement.color}:{}),...(placement.rotation!==undefined?{rotation:placement.rotation as 0|90|180|270}:{})};
  }
  return grid;
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

      expect(neonSolved(buildGrid(level),path,level.emitter.color)).toBe(true);
    },
  );
});
