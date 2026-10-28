import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { createFreePlay, freePlayReducer } from "../../src/application/usecases/tetrilogic/freePlay";
import { lineGoalsMet } from "../../src/application/usecases/tetrilogic/lineGoals";
import { TetriLogicStage } from "../../src/ui/components/TetriLogic/TetriLogicStage";
import type { LevelConfig } from "../../src/shared/types/TetriLogic";

const level: LevelConfig = {
  level: 1, boardSize: { rows: 4, cols: 4 }, inventory: [{ id: "o1", type: "O" }],
  blockedCells: [{ x: 0, y: 0 }], requiredCells: [{ x: 3, y: 3 }],
  precedences: [{ before: "other", after: "o1" }], contacts: [{ first: "o1", second: "other" }], orientations: [{ pieceId: "o1", allowed: [90] }],
  constraints: ["row", "column"].flatMap(orientation => [2, 2, 0, 0].map((targetCount, line) => ({ orientation: orientation as "row" | "column", line, targetCount }))),
};
afterEach(cleanup);

describe("Restored row/column challenge", () => {
  it("requires both axes, including zero targets, while ignoring former challenge conditions", () => {
    let state = createFreePlay(level);
    expect(lineGoalsMet(level, state.pieces)).toBe(false);
    state = freePlayReducer(state, { type: "place", id: "o1", position: { x: 1, y: 0 } });
    expect(lineGoalsMet(level, state.pieces)).toBe(false); // All rows match, columns do not.
    state = freePlayReducer(state, { type: "place", id: "o1", position: { x: 0, y: 0 } });
    expect(lineGoalsMet(level, state.pieces)).toBe(true); // Old blocking/required/rotation/contact/order conditions do not apply.
    state = freePlayReducer(state, { type: "place", id: "o1", position: { x: 0, y: 1 } });
    expect(lineGoalsMet(level, state.pieces)).toBe(false); // Zero-target row is occupied.
  });
  it("never declares success without goals or with colliding geometry", () => {
    const piece = { ...createFreePlay(level).pieces[0], position: { x: 0, y: 0 } };
    expect(lineGoalsMet({ ...level, constraints: [] }, [piece])).toBe(false);
    expect(lineGoalsMet(level, [piece, { ...piece, id: "overlap" }])).toBe(false);
  });
  it("announces live completion and removes it when moving, returning or resetting a piece", () => {
    render(<MemoryRouter><TetriLogicStage levels={[level]} /></MemoryRouter>);
    const select = () => fireEvent.click(screen.getByRole("button", { name: "Seleccionar pieza O (o1)" }));
    const place = () => fireEvent.click(screen.getByRole("button", { name: "Celda vacía, fila 1, columna 1" }));
    select(); place();
    expect(screen.getByRole("status")).toHaveTextContent("Reto completado");
    expect(screen.getByLabelText("Fila 1: 2 de 2")).toHaveAttribute("data-state", "complete");
    fireEvent.keyDown(screen.getByRole("button", { name: "Pieza O, fila 1, columna 1" }), { key: "ArrowRight" });
    expect(screen.getByRole("status")).not.toHaveTextContent("Reto completado");
    expect(screen.getByLabelText("Columna 3: 2 de 0")).toHaveAttribute("data-state", "over");
    fireEvent.keyDown(screen.getByRole("button", { name: "Pieza O, fila 1, columna 2" }), { key: "ArrowLeft" });
    expect(screen.getByRole("status")).toHaveTextContent("Reto completado");
    fireEvent.click(screen.getByRole("button", { name: "Devolver pieza" }));
    expect(screen.getByRole("status")).not.toHaveTextContent("Reto completado");
    select(); place();
    fireEvent.click(screen.getByRole("button", { name: "Restablecer" }));
    fireEvent.click(screen.getByRole("button", { name: "Restablecer tablero" }));
    expect(screen.getByLabelText("Fila 1: 0 de 2")).toHaveAttribute("data-state", "pending");
    expect(screen.getByRole("status")).not.toHaveTextContent("Reto completado");
  });
});
