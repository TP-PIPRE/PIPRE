import { describe, expect, it } from "vitest";
import { NEONFLOW_LEVELS } from "../../src/shared/constants/levelConfigs";
import { raycast } from "../../src/application/usecases/neonflow/raycast";
import type { Cell, Grid } from "../../src/shared/types/NeonFlow";
describe("Neon Flow second template", () => {
  it("requires a detour and can be solved with the existing mirror rules", () => {
    const level = NEONFLOW_LEVELS[1];
    const cells: Cell[] = Array.from({ length: level.width * level.height }, (_, i) => ({ x: i % level.width, y: Math.floor(i / level.width), type: "EMPTY" }));
    level.blocked.forEach(c => { cells[c.y * level.width + c.x] = { ...c }; });
    level.receptors.forEach(r => { cells[r.position.y * level.width + r.position.x] = { ...r.position, color: r.color }; });
    const grid: Grid = { width: level.width, height: level.height, cells };
    expect(raycast(grid, level.emitter.position, level.emitter.direction, "red").at(-1)?.type).toBe("BLOCK");
    cells[2 * level.width + 1] = { x: 1, y: 2, type: "MIRROR_90", rotation: 0 };
    cells[1] = { x: 1, y: 0, type: "MIRROR_90", rotation: 0 };
    expect(raycast(grid, level.emitter.position, level.emitter.direction, "red").at(-1)?.type).toBe("RECEPTOR");
  });
});
