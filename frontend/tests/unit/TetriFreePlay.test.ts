import { describe, expect, it } from "vitest";
import { TETRILOGIC_LEVELS } from "../../src/shared/constants/levelConfigs";
import { canPlaceFreely, createFreePlay, freePlayReducer, isPlaced, rotateFreely, rotateGrip } from "../../src/application/usecases/tetrilogic/freePlay";
import { shapeAt } from "../../src/application/usecases/tetrilogic/rules";

describe("Free TetriLogic geometry", () => {
  it("allows a dependent piece first and ignores the published objectives without mutating the template", () => {
    const level = TETRILOGIC_LEVELS[0], before = JSON.stringify(level);
    let state = createFreePlay(level);
    state = freePlayReducer(state, { type: "place", id: "s1", position: { x: 0, y: 0 } });
    expect(isPlaced(state.pieces.find(p => p.id === "s1")!)).toBe(true);
    state = freePlayReducer(state, { type: "place", id: "i1", position: { x: 0, y: 3 } });
    expect(state.pieces.find(p => p.id === "i1")!.position).toEqual({ x: 0, y: 3 });
    expect(JSON.stringify(level)).toBe(before);
  });
  it("rejects overlaps, fractional anchors and bounds without moving the previous placement", () => {
    let state = createFreePlay(TETRILOGIC_LEVELS[0]);
    state = freePlayReducer(state, { type: "place", id: "i1", position: { x: 0, y: 0 } });
    state = freePlayReducer(state, { type: "place", id: "o1", position: { x: 0, y: 1 } });
    const pieces = state.pieces;
    for (const position of [{ x: 0, y: 0 }, { x: 3, y: 3 }, { x: .5, y: 1 }]) {
      state = freePlayReducer(state, { type: "place", id: "o1", position });
      expect(state.pieces).toEqual(pieces);
    }
  });
  it("returns any placed piece even if the old precedence linked a dependent", () => {
    let state = createFreePlay(TETRILOGIC_LEVELS[0]);
    state = freePlayReducer(state, { type: "place", id: "i1", position: { x: 0, y: 0 } });
    state = freePlayReducer(state, { type: "place", id: "s1", position: { x: 0, y: 1 } });
    state = freePlayReducer(state, { type: "return", id: "i1" });
    expect(isPlaced(state.pieces.find(p => p.id === "i1")!)).toBe(false);
    expect(isPlaced(state.pieces.find(p => p.id === "s1")!)).toBe(true);
  });
  it("keeps the grabbed cell fixed over four quarter turns", () => {
    let piece = { id: "j", type: "J" as const, shape: shapeAt("J", 0), rotation: 0 as 0|90|180|270, position: { x: 2, y: 2 } };
    const original = piece;
    let grip = { x: 1, y: 1 };
    for (let i = 0; i < 4; i++) {
      const nextGrip = rotateGrip(piece, grip);
      piece = rotateFreely(piece, grip); grip = nextGrip;
      expect({ x: piece.position.x + grip.x, y: piece.position.y + grip.y }).toEqual({ x: 3, y: 3 });
    }
    expect(piece).toEqual(original);
  });
  it("does not shift a square or move a piece automatically to make a rotation fit", () => {
    let state = createFreePlay(TETRILOGIC_LEVELS[0]);
    state = freePlayReducer(state, { type: "place", id: "o1", position: { x: 0, y: 0 } });
    state = freePlayReducer(state, { type: "rotate", id: "o1", grip: { x: 0, y: 0 } });
    expect(state.pieces.find(p => p.id === "o1")!.position).toEqual({ x: 0, y: 0 });
    state = freePlayReducer(state, { type: "place", id: "i1", position: { x: 0, y: 3 } });
    const before = state.pieces.find(p => p.id === "i1");
    state = freePlayReducer(state, { type: "rotate", id: "i1", grip: { x: 0, y: 0 } });
    expect(state.pieces.find(p => p.id === "i1")).toEqual(before);
  });
  it("restores the original external inventory and orientations on reset", () => {
    let state = createFreePlay(TETRILOGIC_LEVELS[29]);
    const original = state.pieces;
    state = freePlayReducer(state, { type: "place", id: "t1", position: { x: 0, y: 0 }, rotation: 90 });
    state = freePlayReducer(state, { type: "reset" });
    expect(state.pieces).toEqual(original);
    expect(state.pieces.every(p => !isPlaced(p))).toBe(true);
    expect(state.selectedId).toBeNull();
  });
  it("rejects rotations that would cross the top or left edge without returning the piece to inventory", () => {
    let state = createFreePlay(TETRILOGIC_LEVELS[0]);
    state = freePlayReducer(state, { type: "place", id: "i1", position: { x: 0, y: 0 } });
    const before = state.pieces;
    state = freePlayReducer(state, { type: "rotate", id: "i1", grip: { x: 3, y: 0 } });
    expect(state.pieces).toEqual(before);
    expect(state.message).toBe("No hay espacio para girar aquí.");
    state = freePlayReducer(state, { type: "place", id: "i1", position: { x: 0, y: 0 }, rotation: 90 });
    const vertical = state.pieces;
    state = freePlayReducer(state, { type: "rotate", id: "i1", grip: { x: 0, y: 0 } });
    expect(state.pieces).toEqual(vertical);
  });
  it.each(TETRILOGIC_LEVELS)("keeps the inventory and technical grid valid for stored layout $level", level => {
    const state = createFreePlay(level);
    expect(state.size).toEqual(level.boardSize);
    for (const p of state.pieces) {
      expect(p.shape).toHaveLength(4);
      expect(canPlaceFreely(state.size, [], { ...p, position: { x: 0, y: 0 } })).toBe(true);
    }
  });
});
