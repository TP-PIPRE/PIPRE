import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HistoricalTetriLogicStage as TetriLogicStage } from "../../src/ui/components/TetriLogic/HistoricalTetriLogicStage";
import { TetriLogicInstructions } from "../../src/ui/components/TetriLogic/TetriLogicRules";
import { TETRILOGIC_LEVELS } from "../../src/shared/constants/levelConfigs";
import { useGameStore } from "../../src/infrastructure/store/gameStore";

vi.mock("../../src/infrastructure/api/axiosInstance", () => ({ default: { post: vi.fn().mockResolvedValue({ status: 201 }) } }));
afterEach(() => { cleanup(); useGameStore.getState().stopGame(); });

describe("TetriLogic clarity", () => {
  it("shows shape references and final orientations without repeating technical piece names", () => {
    render(<MemoryRouter><TetriLogicStage levels={[TETRILOGIC_LEVELS[29]]} /></MemoryRouter>);
    expect(screen.getByRole("button", { name: "Seleccionar pieza T (t1)" })).toHaveTextContent("1");
    expect(screen.queryByText("Pieza T · 1")).not.toBeInTheDocument();
    expect(screen.queryByText("T1 → J1")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Coloca antes" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Deben tocarse" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Pieza 1 a 270 grados" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Pieza 1 a 90 grados" })).toBeInTheDocument();
  });
  it("opens an explanation on demand without applying game shortcuts inside the dialog", () => {
    render(<MemoryRouter><TetriLogicStage levels={[TETRILOGIC_LEVELS[0]]} /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Seleccionar pieza I (i1)" }));
    fireEvent.click(screen.getByRole("button", { name: "Cómo jugar" }));
    const dialog = screen.getByRole("dialog", { name: "Cómo jugar" });
    expect(dialog).toHaveTextContent("2/4 significa");
    expect(dialog).toHaveTextContent("No hace falta llenar el tablero");
    fireEvent.keyDown(dialog, { key: "r" });
    expect(useGameStore.getState().movimientos).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("keeps custom teacher instructions expanded and removes repeated paragraphs without losing mission titles", () => {
    const description = "Instrucción propia del docente";
    const view = render(<TetriLogicInstructions description={description} defaultDescription="Objetivo estándar" missions={[
      { id: "m1", title: "Primera misión", objective: description },
      { id: "m2", title: "Segunda misión", objective: "Misión adicional" },
    ]} />);
    expect(view.container.querySelector("details")).toHaveAttribute("open");
    expect(screen.getAllByText(description)).toHaveLength(1);
    expect(screen.getByText("Primera misión")).toBeInTheDocument();
    expect(screen.getByText("Misión adicional")).toBeInTheDocument();
  });
  it("collapses the standard objective while keeping its persisted content available", () => {
    const description = TETRILOGIC_LEVELS[0].description;
    const view = render(<TetriLogicInstructions description={description} defaultDescription={description} missions={[
      { id: "m", title: "Primer encuentro", objective: description! },
    ]} />);
    expect(view.container.querySelector("details")).not.toHaveAttribute("open");
    expect(screen.getAllByText(description!)).toHaveLength(1);
  });
});
