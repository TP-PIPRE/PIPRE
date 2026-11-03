import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HistoricalTetriLogicStage as TetriLogicStage } from "../../src/ui/components/TetriLogic/HistoricalTetriLogicStage";
import { PieceTray } from "../../src/ui/components/TetriLogic/PieceTray";
import { TETRILOGIC_LEVELS } from "../../src/shared/constants/levelConfigs";
import { createInventory } from "../../src/application/usecases/tetrilogic/rules";
import { useGameStore } from "../../src/infrastructure/store/gameStore";
import axiosInstance from "../../src/infrastructure/api/axiosInstance";
import witnesses from "../fixtures/tetrilogicSolutions.json";

vi.mock("../../src/infrastructure/api/axiosInstance", () => ({ default: { post: vi.fn().mockResolvedValue({ status: 201 }) } }));
const level = TETRILOGIC_LEVELS[0];

beforeEach(() => { vi.clearAllMocks(); useGameStore.setState({ attempts: [] }); });
afterEach(() => { cleanup(); useGameStore.getState().stopGame(); });

function open(onNext?: () => void) {
  render(<MemoryRouter><TetriLogicStage levels={[level]} activity={onNext ? { idActivity: "act-c002-1", name: "Primer reto", environment: "tetrilogic", levelTemplate: level.templateId } : undefined} onNext={onNext} /></MemoryRouter>);
}
function select(id: string) {
  const type = level.inventory!.find(p => p.id === id)!.type;
  fireEvent.click(screen.getByRole("button", { name: `Seleccionar pieza ${type} (${id})` }));
}
function cell(row: number, col: number) {
  return screen.getByRole("button", { name: new RegExp(`^(Celda vacía|Celda bloqueada|Pieza [A-Z]), fila ${row}, columna ${col}(, debe ocuparse)?$`) });
}
function complete() {
  const witness = witnesses.find(w => w.templateId === level.templateId)!;
  for (const p of witness.placements) {
    select(p.id);
    if (level.inventory!.find(q => q.id === p.id)!.type !== "O") {
      for (let rotation = 0; rotation < p.rotation; rotation += 90) fireEvent.click(screen.getByRole("button", { name: "Rotar pieza", exact: true }));
    }
    fireEvent.click(cell(p.position.y + 1, p.position.x + 1));
  }
  fireEvent.click(screen.getByRole("button", { name: "Comprobar", exact: true }));
  expect(useGameStore.getState().status).toBe("SUCCESS");
}

describe("TetriLogic interaction controls", () => {
  it("rotates inventory pieces once for right click and once for R without bubbling twice", () => {
    open();
    const inventoryPiece = screen.getByRole("button", { name: "Seleccionar pieza I (i1)" });
    fireEvent.contextMenu(inventoryPiece);
    expect(useGameStore.getState().movimientos).toBe(1);
    expect(screen.getByRole("status")).toHaveTextContent("Pieza 1: 90°");
    fireEvent.keyDown(inventoryPiece, { key: "r" });
    expect(useGameStore.getState().movimientos).toBe(2);
    expect(screen.getByRole("status")).toHaveTextContent("Pieza 1: 180°");
  });

  it("repositions a selected piece onto one of its own occupied cells by touch", () => {
    open();
    select("o1");
    fireEvent.click(cell(1, 1));
    expect(useGameStore.getState().movimientos).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: "Pieza O, fila 1, columna 2" }));
    expect(useGameStore.getState().movimientos).toBe(2);
    expect(screen.getByRole("button", { name: "Celda vacía, fila 1, columna 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pieza O, fila 1, columna 3" })).toBeInTheDocument();
  });

  it("explains why a prerequisite cannot be returned before its dependent", () => {
    open();
    select("i1");
    fireEvent.click(cell(1, 1));
    select("s1");
    fireEvent.click(cell(2, 1));
    expect(useGameStore.getState().movimientos).toBe(2);
    fireEvent.click(screen.getByRole("button", { name: "Cancelar selección", exact: true }));
    fireEvent.click(screen.getByRole("button", { name: "Pieza I, fila 1, columna 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Devolver pieza" }));
    expect(screen.getByRole("status")).toHaveTextContent("Devuelve primero la pieza 2, que depende de la pieza 1");
    expect(useGameStore.getState().movimientos).toBe(2);
    expect(screen.queryByRole("button", { name: "Seleccionar pieza I (i1)" })).not.toBeInTheDocument();
  });

  it("makes a disabled inventory button non-draggable and blocks its normal click", () => {
    const onSelect = vi.fn();
    const onRotate = vi.fn();
    render(<PieceTray pieces={createInventory(level)} disabled onSelectPiece={onSelect} onRotatePiece={onRotate} />);
    const inventoryPiece = screen.getByRole("button", { name: "Seleccionar pieza I (i1)" });
    expect(inventoryPiece).toBeDisabled();
    expect(inventoryPiece).toHaveAttribute("draggable", "false");
    fireEvent.click(inventoryPiece);
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.contextMenu(inventoryPiece);
    fireEvent.keyDown(inventoryPiece, { key: "r" });
    expect(onRotate).not.toHaveBeenCalled();
  });

  it("selects another placed piece without cancelling or attempting to move the previous one", () => {
    open();
    select("i1"); fireEvent.click(cell(1, 1));
    select("s1"); fireEvent.click(cell(2, 1));
    fireEvent.click(screen.getByRole("button", { name: "Pieza I, fila 1, columna 1" }));
    expect(screen.getByRole("status")).toHaveTextContent("Pieza 1 seleccionada");
    expect(screen.getByRole("button", { name: "Pieza I, fila 1, columna 1" })).toHaveAttribute("aria-pressed", "true");
    expect(useGameStore.getState().movimientos).toBe(2);
  });

  it("preserves the grabbed cell offset when dragging a placed piece", () => {
    open(); select("o1"); fireEvent.click(cell(1, 1));
    const payload = new Map<string, string>();
    const dataTransfer = { setData: (type: string, data: string) => payload.set(type, data), getData: (type: string) => payload.get(type) ?? "", effectAllowed: "", dropEffect: "" };
    fireEvent.dragStart(screen.getByRole("button", { name: "Pieza O, fila 1, columna 2" }), { dataTransfer });
    fireEvent.drop(cell(1, 3), { dataTransfer });
    expect(screen.getByRole("button", { name: "Pieza O, fila 1, columna 2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pieza O, fila 1, columna 3" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Celda vacía, fila 1, columna 4" })).toBeInTheDocument();
    expect(useGameStore.getState().movimientos).toBe(2);
  });

  it("locks board actions and avoids duplicate telemetry after success", () => {
    open();
    complete();
    const moves = useGameStore.getState().movimientos;
    const solvedCell = screen.getAllByRole("button", { name: /^Pieza / })[0];
    expect(solvedCell).toBeDisabled();
    expect(screen.getByRole("button", { name: "Rotar pieza", exact: true })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reiniciar", exact: true })).toBeDisabled();
    fireEvent.contextMenu(solvedCell);
    fireEvent.keyDown(solvedCell, { key: "r" });
    fireEvent.click(screen.getByRole("button", { name: "Comprobar", exact: true }));
    expect(useGameStore.getState().movimientos).toBe(moves);
    expect(useGameStore.getState().attempts).toHaveLength(1);
    expect(axiosInstance.post).toHaveBeenCalledTimes(1);
  });

  it("offers the supplied next-activity callback after completing a persisted activity", () => {
    const onNext = vi.fn();
    open(onNext);
    expect(screen.queryByRole("button", { name: "Siguiente reto" })).not.toBeInTheDocument();
    complete();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente reto" }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("starts a clean attempt after success while retaining the completed history", () => {
    open();
    fireEvent.click(screen.getByRole("button", { name: "Pista general" }));
    complete();
    expect(useGameStore.getState().attempts).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Volver a intentar" }));
    expect(useGameStore.getState().status).toBe("PLAYING");
    expect(useGameStore.getState().movimientos).toBe(0);
    expect(useGameStore.getState().reinicios).toBe(0);
    expect(useGameStore.getState().attempts).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Comprobar", exact: true })).toBeEnabled();
    expect(screen.getAllByRole("button", { name: /^Seleccionar pieza / })).toHaveLength(level.inventory!.length);
    expect(screen.queryByRole("complementary", { name: "Pista estática" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "¡Reto completado!" })).not.toBeInTheDocument();
  });
});
