import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createNeonGrid, neonSolved } from '../frontend/src/application/usecases/neonflow/board.ts';
import { raycast } from '../frontend/src/application/usecases/neonflow/raycast.ts';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const levels = JSON.parse(read('backend/src/main/resources/catalog/neonflow-v3.json'));
const frontend = JSON.parse(read('frontend/src/shared/constants/neonFlowProgressiveCatalog.json'));
const witnesses = JSON.parse(read('backend/src/main/resources/catalog/neonflow-v3-witnesses.json'));
const migration = read('backend/src/main/resources/db/migration/V32__neonflow_progressive_catalog.sql');
const directions = [[1, 0], [0, 1], [-1, 0], [0, -1]];

// Shortest path in a relaxed model that can turn independently each time it visits a cell.
// A legal witness with the same cost proves the actual minimum despite that relaxation.
function minimumTurns(level, grid) {
  const { width, height, emitter } = level;
  const origin = emitter.position.y * width + emitter.position.x;
  const heading = directions.findIndex(([dx, dy]) => dx === emitter.direction.dx && dy === emitter.direction.dy);
  assert.ok(heading >= 0);
  const key = (cell, direction) => cell * 4 + direction;
  const start = key(origin, heading);
  const best = new Map([[start, 0]]);
  const queue = [start];
  while (queue.length) {
    const state = queue.shift();
    const index = Math.floor(state / 4);
    const direction = state % 4;
    const cell = grid.cells[index];
    if (cell.type === 'RECEPTOR') {
      if (cell.color === emitter.color) return best.get(state);
      continue;
    }
    for (const turn of index === origin ? [0] : [0, 1, 3]) {
      const nextDirection = (direction + turn) % 4;
      const [dx, dy] = directions[nextDirection];
      const x = cell.x + dx;
      const y = cell.y + dy;
      if (x < 0 || y < 0 || x >= width || y >= height) continue;
      const nextIndex = y * width + x;
      if (grid.cells[nextIndex].type === 'BLOCK') continue;
      const next = key(nextIndex, nextDirection);
      const cost = best.get(state) + Number(turn !== 0);
      if (cost >= (best.get(next) ?? Infinity)) continue;
      best.set(next, cost);
      if (turn) queue.push(next);
      else queue.unshift(next);
    }
  }
  return Infinity;
}

assert.deepEqual(frontend, levels);
assert.equal(levels.length, 30);
assert.equal(witnesses.length, levels.length);
for (const [index, level] of levels.entries()) {
  assert.equal(level.level, index + 1);
  assert.equal(level.templateId, `neonflow-v3-${level.level}`);
  assert.equal(level.receptors.length, 1);
  assert.ok(migration.includes(`JSON '${JSON.stringify(level)}'`), level.templateId);
  const grid = createNeonGrid(level);
  const minimum = 2 + Math.floor(index / 5);
  assert.equal(minimumTurns(level, grid), minimum, level.templateId);
  const witness = witnesses[index];
  assert.equal(witness.templateId, level.templateId);
  assert.equal(witness.placements.length, minimum);
  for (const placement of witness.placements) {
    assert.equal(placement.type, 'MIRROR_90');
    const cell = grid.cells[placement.position.y * grid.width + placement.position.x];
    assert.equal(cell.type, 'EMPTY');
    assert.notDeepEqual(placement.position, { x: level.emitter.position.x, y: level.emitter.position.y });
    Object.assign(cell, { type: placement.type, rotation: placement.rotation });
  }
  const path = raycast(grid, level.emitter.position, level.emitter.direction, level.emitter.color);
  assert.ok(neonSolved(grid, path, level.emitter.color), level.templateId);
}
console.log('Neon Flow v3: 30 soluciones mínimas verificadas con 2, 3, 4, 5, 6 y 7 espejos por bloques de cinco niveles.');
