import axiosInstance from "../../src/infrastructure/api/axiosInstance";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { NeonFlowStage } from "../../src/ui/components/NeonFlow/NeonFlowStage";
import { TetriLogicStage } from "../../src/ui/components/TetriLogic/TetriLogicStage";
import { useGameStore } from "../../src/infrastructure/store/gameStore";

vi.mock("../../src/infrastructure/api/axiosInstance", () => ({ default: { post: vi.fn() } }));
beforeEach(() => { vi.mocked(axiosInstance.post).mockResolvedValue({ status: 201 }); });
afterEach(() => { cleanup(); useGameStore.getState().stopGame(); vi.unstubAllGlobals(); });

describe("Accessible simulator interactions", () => {
  it("supports native drag and drop from the optical tray", () => {
    render(<MemoryRouter><NeonFlowStage /></MemoryRouter>);
    const transfer = {
      dropEffect: "none",
      setData: vi.fn(),
      getData: vi.fn().mockReturnValue(JSON.stringify({ type: "MIRROR_90" })),
    };
    fireEvent.dragStart(screen.getByRole("button", { name: "Espejo 90°" }), { dataTransfer: transfer });
    fireEvent.dragOver(screen.getByRole("button", { name: "Celda vacía, fila 2, columna 2" }), { dataTransfer: transfer });
    fireEvent.drop(screen.getByRole("button", { name: "Celda vacía, fila 2, columna 2" }), { dataTransfer: transfer });
    expect(transfer.setData).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Rotar espejo, fila 2, columna 2/ })).toBeInTheDocument();
    expect(useGameStore.getState().movimientos).toBe(1);
  });

  it("supports native drag and drop from the Tetrimino tray", () => {
    render(<MemoryRouter><TetriLogicStage /></MemoryRouter>);
    const transfer = {
      dropEffect: "none",
      setData: vi.fn(),
      getData: vi.fn().mockReturnValue(JSON.stringify({ pieceId: "o1" })),
    };
    fireEvent.dragStart(screen.getByRole("button", { name: "Seleccionar pieza O (o1)" }), { dataTransfer: transfer });
    fireEvent.dragOver(screen.getByRole("button", { name: "Celda vacía, fila 1, columna 1" }), { dataTransfer: transfer });
    fireEvent.drop(screen.getByRole("button", { name: "Celda vacía, fila 1, columna 1" }), { dataTransfer: transfer });
    expect(transfer.setData).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Pieza O, fila 1, columna 1" })).toBeInTheDocument();
    expect(useGameStore.getState().movimientos).toBe(1);
  });

  it("places and rotates an optical component without dragging, then resets the board", () => {
    render(<MemoryRouter><NeonFlowStage /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Espejo 90°" }));
    fireEvent.click(screen.getByRole("button", { name: "Celda vacía, fila 2, columna 2" }));
    expect(useGameStore.getState().movimientos).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: /Rotar espejo, fila 2, columna 2, 0/ }));
    expect(screen.getByRole("button", { name: /Rotar espejo, fila 2, columna 2, 90/ })).toBeInTheDocument();
    expect(useGameStore.getState().movimientos).toBe(2);
    fireEvent.click(screen.getByRole("button", { name: "Reiniciar" }));
    expect(screen.getByRole("button", { name: "Celda vacía, fila 2, columna 2" })).toBeInTheDocument();
    expect(useGameStore.getState().reinicios).toBe(1);
  });

  it("preserves the Neon Flow success path and records a completed attempt", () => {
    render(<MemoryRouter><NeonFlowStage /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
    expect(screen.getByText("¡Receptor iluminado! Nivel completado.")).toBeInTheDocument();
    expect(useGameStore.getState().status).toBe("SUCCESS");
    expect(axiosInstance.post).toHaveBeenCalledWith("telemetry", expect.objectContaining({ game: "neonflow", result: "SUCCESS" }), { skipAuthRedirect: true });
    expect(screen.getByRole("button", { name: "Comprobar" })).toBeDisabled();
  });

  it("uses existing TetriLogic placement validation for the tap alternative", () => {
    render(<MemoryRouter><TetriLogicStage /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Seleccionar pieza O (o1)" }));
    fireEvent.click(screen.getByRole("button", { name: "Celda vacía, fila 4, columna 4" }));
    expect(useGameStore.getState().movimientos).toBe(0);
    expect(screen.getByRole("status")).toHaveTextContent("La pieza no cabe aquí");
    fireEvent.click(screen.getByRole("button", { name: "Celda vacía, fila 1, columna 1" }));
    expect(useGameStore.getState().movimientos).toBe(1);
    expect(screen.getByRole("button", { name: "Pieza O, fila 1, columna 1" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reiniciar" }));
    expect(screen.getByRole("button", { name: "Seleccionar pieza O (o1)" })).toBeInTheDocument();
  });
});
