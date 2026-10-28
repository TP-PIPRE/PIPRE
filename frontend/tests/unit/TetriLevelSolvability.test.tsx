import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HistoricalTetriLogicStage as TetriLogicStage } from "../../src/ui/components/TetriLogic/HistoricalTetriLogicStage";
import { LEGACY_TETRILOGIC_LEVELS as TETRILOGIC_LEVELS } from "../../src/shared/constants/levelConfigs";
import { useGameStore } from "../../src/infrastructure/store/gameStore";
vi.mock("../../src/infrastructure/api/axiosInstance", () => ({ default: { post: vi.fn().mockResolvedValue({ status: 201 }) } }));
afterEach(() => { cleanup(); useGameStore.getState().stopGame(); });
function place(piece: string, row: number, col: number) {
  fireEvent.click(screen.getByRole("button", { name: `Seleccionar pieza ${piece}` }));
  fireEvent.click(screen.getByRole("button", { name: `Celda vacía, fila ${row}, columna ${col}` }));
}
describe("Playable TetriLogic templates", () => {
  it.each([0, 1])("can complete template index %i using the existing placement and victory rules", index => {
    render(<MemoryRouter><TetriLogicStage levels={[TETRILOGIC_LEVELS[index]]} /></MemoryRouter>);
    place("O (o1)", 1, 1); place("O (o2)", 1, 3); place("I (i1)", 3, 1);
    if (index === 0) place("I (i2)", 4, 1);
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
    expect(useGameStore.getState().status).toBe("SUCCESS");
    expect(screen.getByText("¡Curso Completado!")).toBeInTheDocument();
  });
});
