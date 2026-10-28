import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TetriLogicStage } from "../../src/ui/components/TetriLogic/TetriLogicStage";
import { TETRILOGIC_LEVELS } from "../../src/shared/constants/levelConfigs";
import { useGameStore } from "../../src/infrastructure/store/gameStore";
import axiosInstance from "../../src/infrastructure/api/axiosInstance";
import witnesses from "../fixtures/tetrilogicSolutions.json";

vi.mock("../../src/infrastructure/api/axiosInstance", () => ({ default: { post: vi.fn() } }));
beforeEach(() => { vi.clearAllMocks(); useGameStore.getState().stopGame(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function open(index = 0) { render(<MemoryRouter><TetriLogicStage levels={[TETRILOGIC_LEVELS[index]]} /></MemoryRouter>); }
function select(type: string, id: string) { fireEvent.click(screen.getByRole("button", { name: `Seleccionar pieza ${type} (${id})` })); }
function cell(row: number, col: number) { return screen.getByRole("button", { name: new RegExp(`^(Celda vacía|Pieza [A-Z]), fila ${row}, columna ${col}$`) }); }
function mockPointerLayout() {
  class SimulatedPointerEvent extends MouseEvent {
    pointerId: number; pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) { super(type, init); this.pointerId = init.pointerId ?? 1; this.pointerType = init.pointerType ?? "mouse"; }
  }
  vi.stubGlobal("PointerEvent", SimulatedPointerEvent);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const x = this.dataset.cellX, y = this.dataset.cellY;
    const left = x !== undefined ? 100 + Number(x) * 50 : 400;
    const top = y !== undefined ? 100 + Number(y) * 50 : 100;
    const width = x !== undefined ? 50 : 200;
    return { x: left, y: top, left, top, right: left + width, bottom: top + width, width, height: width, toJSON: () => ({}) };
  });
}
const pointer = (x: number, y: number, pointerType = "mouse") => ({ clientX: x, clientY: y, pointerId: 1, pointerType, button: 0, buttons: 1 });

describe("Direct manipulation with row and column goals", () => {
  it("restores counts without restoring blocked cells, dependencies or scoring", () => {
    open();
    expect(screen.getAllByRole("button", { name: /^Celda vacía/ })).toHaveLength(16);
    expect(screen.queryByRole("button", { name: "Comprobar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Reglas del reto" })).not.toBeInTheDocument();
    expect(screen.queryByText("Movimientos")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /bloqueada|debe ocuparse/ })).not.toBeInTheDocument();
    select("I", "i1"); fireEvent.click(cell(4, 1)); // Exceeding a target is allowed while experimenting, but cannot complete the challenge.
    expect(screen.getAllByRole("button", { name: /^Pieza I,/ })).toHaveLength(4);
    expect(screen.getByLabelText("Fila 4: 4 de 3")).toHaveAttribute("data-state", "over");
    expect(screen.getByRole("status")).not.toHaveTextContent("Reto completado");
    expect(useGameStore.getState().status).toBe("IDLE");
    expect(axiosInstance.post).not.toHaveBeenCalled();
  });
  it("permits any placement order and returns a previous prerequisite without taking its dependent away", () => {
    open(); select("S", "s1"); fireEvent.click(cell(2, 1));
    select("I", "i1"); fireEvent.click(cell(1, 1));
    fireEvent.click(screen.getByRole("button", { name: "Devolver pieza" }));
    expect(screen.getByRole("button", { name: "Seleccionar pieza I (i1)" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Pieza S,/ })).toHaveLength(4);
  });
  it("moves with the keyboard and rejects a collision without jumping or losing a piece", () => {
    open(); select("I", "i1"); fireEvent.click(cell(1, 1));
    select("O", "o1"); fireEvent.click(cell(2, 1));
    fireEvent.keyDown(cell(2, 1), { key: "ArrowUp" });
    expect(screen.getByRole("status")).toHaveTextContent("Ese espacio no está disponible");
    expect(screen.getByRole("button", { name: "Pieza O, fila 2, columna 1" })).toBeInTheDocument();
    fireEvent.keyDown(cell(2, 1), { key: "ArrowRight" });
    expect(screen.getByRole("button", { name: "Pieza O, fila 2, columna 2" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Pieza O,/ })).toHaveLength(4);
  });
  it.each(["mouse", "touch"])("previews and commits a %s pointer drag", pointerType => {
    mockPointerLayout(); open();
    const source = screen.getByRole("button", { name: "Seleccionar pieza O (o1)" });
    fireEvent.pointerDown(source, pointer(450, 150, pointerType));
    fireEvent.pointerMove(source, pointer(155, 155, pointerType));
    expect(document.querySelector(".tetri-free-preview")).toHaveAttribute("data-valid", "true");
    expect(screen.queryByRole("button", { name: /^Pieza O,/ })).not.toBeInTheDocument();
    fireEvent.pointerUp(source, pointer(155, 155, pointerType));
    expect(screen.getByRole("button", { name: "Pieza O, fila 2, columna 2" })).toBeInTheDocument();
    expect(document.querySelector(".tetri-free-preview")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Pieza O,/ })).toHaveLength(4);
  });
  it("rotates a held piece before dragging and commits the new orientation once", () => {
    mockPointerLayout(); open();
    const source = screen.getByRole("button", { name: "Seleccionar pieza I (i1)" });
    fireEvent.pointerDown(source, pointer(450, 150));
    fireEvent.keyDown(source, { key: "r" });
    fireEvent.pointerMove(source, pointer(175, 110));
    fireEvent.pointerUp(source, pointer(175, 110));
    for (let row = 1; row <= 4; row++) expect(screen.getByRole("button", { name: `Pieza I, fila ${row}, columna 2` })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Pieza I,/ })).toHaveLength(4);
  });
  it("preserves the grabbed cell on a placed piece and restores it after an invalid release", () => {
    mockPointerLayout(); open(); select("O", "o1"); fireEvent.click(cell(1, 1));
    const source = cell(1, 2);
    fireEvent.pointerDown(source, pointer(175, 125));
    fireEvent.pointerMove(source, pointer(225, 175));
    fireEvent.pointerUp(source, pointer(225, 175));
    expect(screen.getByRole("button", { name: "Pieza O, fila 2, columna 2" })).toBeInTheDocument();
    const newSource = cell(2, 3);
    fireEvent.pointerDown(newSource, pointer(225, 175));
    fireEvent.pointerMove(newSource, pointer(110, 110));
    expect(document.querySelector(".tetri-free-preview")).toHaveAttribute("data-valid", "false");
    fireEvent.pointerUp(newSource, pointer(110, 110));
    expect(screen.getByRole("button", { name: "Pieza O, fila 2, columna 2" })).toBeInTheDocument();
  });
  it("cancels pointer interruption and Escape without losing the original piece or placing it on release", () => {
    mockPointerLayout(); open();
    const source = screen.getByRole("button", { name: "Seleccionar pieza O (o1)" });
    fireEvent.pointerDown(source, pointer(450, 150));
    fireEvent.pointerMove(source, pointer(155, 155));
    fireEvent.pointerCancel(source, pointer(155, 155));
    expect(document.querySelector(".tetri-free-preview")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Seleccionar pieza O (o1)" })).toBeInTheDocument();
    fireEvent.pointerDown(source, pointer(450, 150));
    fireEvent.pointerMove(source, pointer(155, 155));
    fireEvent.keyDown(source, { key: "Escape" });
    fireEvent.pointerUp(source, pointer(155, 155));
    expect(screen.queryByRole("button", { name: /^Pieza O,/ })).not.toBeInTheDocument();
  });
  it("accepts a drag back to the external tray and keeps its orientation", () => {
    mockPointerLayout(); open(); select("I", "i1");
    fireEvent.click(screen.getByRole("button", { name: "Rotar pieza" })); fireEvent.click(cell(1, 1));
    const source = cell(1, 1);
    fireEvent.pointerDown(source, pointer(125, 125)); fireEvent.pointerMove(source, pointer(450, 150));
    expect(document.querySelector(".tetri-free-preview")).toHaveAttribute("data-over-tray", "true");
    fireEvent.pointerUp(source, pointer(450, 150));
    const returned = screen.getByRole("button", { name: "Seleccionar pieza I (i1)" });
    expect(returned.querySelector(".tetri-mini-grid")).toHaveStyle({ gridTemplateRows: "repeat(4, 12px)" });
    expect(screen.queryByRole("button", { name: /^Pieza I,/ })).not.toBeInTheDocument();
  });
  it("preserves the grabbed cell after an invalid top-edge rotation", () => {
    open(); select("I", "i1"); fireEvent.click(cell(1, 1));
    fireEvent.click(cell(1, 4));
    fireEvent.keyDown(cell(1, 4), { key: "r" });
    expect(screen.getByRole("status")).toHaveTextContent("No hay espacio para girar aquí.");
    expect(screen.getAllByRole("button", { name: /^Pieza I,/ })).toHaveLength(4);
    fireEvent.click(cell(3, 4));
    expect(screen.getByRole("button", { name: "Pieza I, fila 3, columna 1" })).toBeInTheDocument();
  });
  it.each(TETRILOGIC_LEVELS)("completes stored challenge $level using only its row/column goals without submitting scores", level => {
    mockPointerLayout();
    render(<MemoryRouter><TetriLogicStage levels={[level]} /></MemoryRouter>);
    const witness = witnesses.find(w => w.templateId === level.templateId)!;
    for (const placement of witness.placements) {
      const piece = level.inventory!.find(p => p.id === placement.id)!;
      select(piece.type, piece.id);
      for (let angle = 0; angle < placement.rotation; angle += 90) fireEvent.click(screen.getByRole("button", { name: "Rotar pieza" }));
      // A shape's bounding-box corner can belong to another piece: drag supports that anchor.
      const source = screen.getByRole("button", { name: `Seleccionar pieza ${piece.type} (${piece.id})` });
      const destination = pointer(125 + placement.position.x * 50, 125 + placement.position.y * 50);
      fireEvent.pointerDown(source, pointer(550, 150));
      fireEvent.pointerMove(source, destination);
      fireEvent.pointerUp(source, destination);
      expect(screen.queryByRole("button", { name: `Seleccionar pieza ${piece.type} (${piece.id})` }), `${level.templateId}: ${piece.id}, rotation ${placement.rotation}, status ${screen.getByRole("status").textContent}`).not.toBeInTheDocument();
    }
    expect(screen.getAllByRole("button", { name: /^Pieza [A-Z],/ })).toHaveLength(level.inventory!.length * 4);
    expect(screen.queryByRole("button", { name: /^Seleccionar pieza / })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /completado/i })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Reto completado. Todas las filas y columnas coinciden.");
    expect(axiosInstance.post).not.toHaveBeenCalled();
  });
});
