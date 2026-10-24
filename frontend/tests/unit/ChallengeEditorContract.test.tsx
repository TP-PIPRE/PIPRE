import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DocenteRetosPage } from "../../src/ui/pages/DocenteRetosPage";
import { apiService } from "../../src/infrastructure/api/apiService";
vi.mock("../../src/infrastructure/api/apiService", () => ({ apiService: {
  courses: { getAll: vi.fn() }, modules: { getByCourse: vi.fn() }, lessons: { getByModule: vi.fn() },
  activities: { getByLesson: vi.fn(), create: vi.fn(), update: vi.fn() },
} }));
const activity = { idActivity: "a1", idLesson: "l1", name: "Reto existente", description: "Guía la luz", displayOrder: 2, levelTemplate: "neonflow-2", difficulty: "HARD", complexity: "LOW", logicLevel: 1, type: "robotics", environment: "neonflow", missions: [{ id: "m1", title: "Meta", objective: "Objetivo", maxBlocks: 5 }], startingPosition: { x: 1, z: 2 }, targetPosition: { x: 3, z: 4 } };
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(apiService.courses.getAll).mockResolvedValue([{ idCourse: "c1", name: "Curso", level: "HIGH", description: "Texto" }]);
  vi.mocked(apiService.modules.getByCourse).mockResolvedValue([{ idModule: "m1", title: "Módulo" }]);
  vi.mocked(apiService.lessons.getByModule).mockResolvedValue([{ idLesson: "l1", title: "Lección" }]);
  vi.mocked(apiService.activities.getByLesson).mockResolvedValue([activity]);
  vi.mocked(apiService.activities.create).mockResolvedValue(undefined);
  vi.mocked(apiService.activities.update).mockResolvedValue(undefined);
});
afterEach(cleanup);
async function openList() {
  render(<MemoryRouter><DocenteRetosPage /></MemoryRouter>);
  fireEvent.click(await screen.findByRole("button", { name: "Retos", exact: true }));
  await screen.findByText("Reto existente");
}
describe("Challenge editor contract", () => {
  it("saves edits with PUT while preserving the server's metadata", async () => {
    await openList();
    fireEvent.click(screen.getByRole("button", { name: "Editar", exact: true }));
    const title = screen.getByLabelText("Título", { exact: true });
    expect(screen.getByLabelText("Descripción", { exact: true })).toHaveValue("Guía la luz");
    expect(screen.getByLabelText("Orden", { exact: true })).toHaveValue(2);
    fireEvent.change(title, { target: { value: "Reto editado" } });
    await waitFor(() => expect(screen.getByLabelText("Lección", { exact: true })).toHaveValue("l1"));
    fireEvent.click(screen.getByRole("button", { name: /^guardar cambios$/i }));
    await waitFor(() => expect(apiService.activities.update).toHaveBeenCalledWith("a1", expect.objectContaining({ name: "Reto editado", idLesson: "l1", difficulty: "HARD", complexity: "LOW", logicLevel: 1, description: "Guía la luz", displayOrder: 2, levelTemplate: "neonflow-2", missions: activity.missions, startingPosition: activity.startingPosition, targetPosition: activity.targetPosition })));
    expect(apiService.activities.create).not.toHaveBeenCalled();
  });
  it("completes creation when the backend returns an empty 201 body", async () => {
    await openList();
    fireEvent.click(screen.getByRole("button", { name: /Nuevo Reto/ }));
    fireEvent.change(screen.getByLabelText("Título", { exact: true }), { target: { value: "Nuevo reto" } });
    await waitFor(() => expect(screen.getByLabelText("Lección", { exact: true })).toHaveValue("l1"));
    fireEvent.click(screen.getByRole("button", { name: /^crear reto$/i }));
    await waitFor(() => expect(apiService.activities.create).toHaveBeenCalledWith(expect.objectContaining({ idLesson: "l1", name: "Nuevo reto" })));
    await screen.findByText("Retos Existentes");
  });
  it("does not save into the previous lesson when the selected module has none", async () => {
    vi.mocked(apiService.modules.getByCourse).mockResolvedValue([{ idModule: "m1", title: "Con lección" }, { idModule: "m2", title: "Sin lecciones" }]);
    vi.mocked(apiService.lessons.getByModule).mockImplementation(async id => id === "m1" ? [{ idLesson: "l1", title: "Lección" }] : []);
    await openList();
    fireEvent.click(screen.getByRole("button", { name: "Editar", exact: true }));
    await waitFor(() => expect(screen.getByLabelText("Lección", { exact: true })).toHaveValue("l1"));
    fireEvent.change(screen.getByLabelText("Módulo", { exact: true }), { target: { value: "m2" } });
    await screen.findByText("Este módulo necesita una lección");
    expect(screen.getByRole("button", { name: /^guardar cambios$/i })).toBeDisabled();
    expect(apiService.activities.update).not.toHaveBeenCalled();
  });
});
