import { describe, expect, it } from "vitest";
import { cellsOf, placementError, shapeAt, solutionError } from "../../src/application/usecases/tetrilogic/rules";
import type { LevelConfig, Piece, RotationAngle, TetriminoType } from "../../src/shared/types/TetriLogic";

// Two independently constructed solutions with DIFFERENT occupied cells have the
// same complete row/column counts. Neither is a privileged answer in the engine.
const level: LevelConfig = {
  level: 1,
  boardSize: { rows: 5, cols: 5 },
  blockedCells: [{ x: 0, y: 4 }],
  inventory: [{ id: "o1", type: "O" }, { id: "i1", type: "I" }, { id: "t1", type: "T" }],
  constraints: [
    ...[1, 3, 4, 3, 1].map((targetCount, line) => ({ orientation: "row" as const, line, targetCount })),
    ...[2, 2, 4, 1, 3].map((targetCount, line) => ({ orientation: "column" as const, line, targetCount })),
  ],
  requiredCells: [{ x: 2, y: 2 }],
  precedences: [{ before: "o1", after: "i1" }, { before: "i1", after: "t1" }],
  contacts: [{ first: "o1", second: "i1" }, { first: "i1", second: "t1" }],
  orientations: [{ pieceId: "t1", allowed: [90] }],
};

function piece(id: string, type: TetriminoType, x: number, y: number, rotation: RotationAngle): Piece {
  return { id, type, position: { x, y }, rotation, shape: shapeAt(type, rotation) };
}
function firstSolution(): Piece[] {
  return [piece("o1", "O", 0, 1, 0), piece("i1", "I", 2, 0, 270), piece("t1", "T", 3, 2, 90)];
}
function secondSolution(): Piece[] {
  return [piece("o1", "O", 0, 2, 0), piece("i1", "I", 2, 1, 90), piece("t1", "T", 3, 0, 90)];
}
function occupied(pieces: Piece[]): string[] {
  return pieces.flatMap(cellsOf).map(c => `${c.x},${c.y}`).sort();
}

describe("TetriLogic rule boundaries", () => {
  it("accepts different valid arrangements rather than comparing a hidden answer", () => {
    const first = firstSolution(), second = secondSolution();
    expect(occupied(first)).not.toEqual(occupied(second));
    expect(solutionError(level, first)).toBeNull();
    expect(solutionError(level, second)).toBeNull();
  });

  it("rejects a placement crossing the edge", () => {
    expect(placementError(level, [], piece("i1", "I", 3, 0, 0))).toMatch(/no cabe/);
  });

  it("rejects a shape covering a blocked cell", () => {
    expect(placementError(level, [], piece("o1", "O", 0, 3, 0))).toMatch(/no cabe/);
  });

  it("rejects overlapping pieces and also validates overlap on final check", () => {
    const placed = firstSolution();
    const overlapping = piece("i1", "I", 0, 1, 0);
    expect(placementError(level, [placed[0]], overlapping)).toMatch(/no cabe/);
    expect(solutionError(level, [placed[0], overlapping, placed[2]])).toMatch(/superponerse/);
  });

  it("allows an intermediate row count above its final target", () => {
    // This O occupies two cells in row 1, whose final target is one. The student
    // may explore and correct it; only geometry/order block the placement.
    const exploratory = piece("o1", "O", 0, 0, 0);
    expect(placementError(level, [], exploratory)).toBeNull();
    expect(solutionError(level, [exploratory])).toMatch(/todas las piezas/);
  });

  it("requires a prerequisite before the first placement of its dependent", () => {
    const [o, i, t] = firstSolution();
    expect(placementError(level, [], i)).toMatch(/O1 antes de I1/);
    expect(placementError(level, [o], i)).toBeNull();
    expect(placementError(level, [o], t)).toMatch(/I1 antes de T1/);
    expect(placementError(level, [o, i], t)).toBeNull();
  });

  it("permits repositioning a previously placed prerequisite", () => {
    const placed = firstSolution();
    expect(placementError(level, placed, placed[0])).toBeNull();
  });

  it("requires every configured marked cell in the final solution", () => {
    expect(solutionError({ ...level, requiredCells: [{ x: 0, y: 0 }] }, firstSolution())).toMatch(/marcadas/);
  });

  it("checks required contacts separately from row and column totals", () => {
    expect(solutionError({ ...level, contacts: [{ first: "o1", second: "t1" }] }, firstSolution())).toMatch(/compartir un lado/);
  });

  it("checks configured orientations separately from row and column totals", () => {
    expect(solutionError({ ...level, orientations: [{ pieceId: "t1", allowed: [0] }] }, firstSolution())).toMatch(/orientación de T1/);
  });

  it("rejects a final row count that does not match", () => {
    const constraints = level.constraints.map(c => c.orientation === "row" && c.line === 0 ? { ...c, targetCount: 2 } : c);
    expect(solutionError({ ...level, constraints }, firstSolution())).toMatch(/filas y columnas/);
  });

  it("rejects a final column count that does not match", () => {
    const constraints = level.constraints.map(c => c.orientation === "column" && c.line === 4 ? { ...c, targetCount: 2 } : c);
    expect(solutionError({ ...level, constraints }, firstSolution())).toMatch(/filas y columnas/);
  });

  it("rejects a malformed three-cell piece even when its ID and type match", () => {
    const placed = firstSolution();
    placed[1] = { ...placed[1], shape: placed[1].shape.slice(0, 3) };
    expect(solutionError(level, placed)).toMatch(/forma de una pieza/);
  });

  it("rejects duplicate instances and substituted inventory IDs", () => {
    const placed = firstSolution();
    expect(solutionError(level, [placed[0], placed[0], placed[2]])).toMatch(/duplicadas/);
    expect(solutionError(level, [placed[0], { ...placed[1], id: "invented" }, placed[2]])).toMatch(/todas las piezas/);
  });
});
