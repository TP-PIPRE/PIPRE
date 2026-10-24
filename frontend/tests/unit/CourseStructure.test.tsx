import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CourseStructure } from "../../src/ui/components/common/CourseStructure";
import { apiService } from "../../src/infrastructure/api/apiService";
vi.mock("../../src/infrastructure/api/apiService", () => ({ apiService: {
  modules: { getByCourse: vi.fn(), create: vi.fn() }, lessons: { getByModule: vi.fn(), create: vi.fn() },
} }));
beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);
describe("Course structure creation", () => {
  it("builds a new course's module and lesson using empty 201 responses", async () => {
    vi.mocked(apiService.modules.getByCourse).mockResolvedValueOnce([]).mockResolvedValue([{ idModule: "m-new", title: "Módulo nuevo" }]);
    vi.mocked(apiService.lessons.getByModule).mockResolvedValueOnce([]).mockResolvedValue([{ idLesson: "l-new", title: "Lección nueva" }]);
    vi.mocked(apiService.modules.create).mockResolvedValue(undefined);
    vi.mocked(apiService.lessons.create).mockResolvedValue(undefined);
    render(<CourseStructure courseId="c-new" />);
    await screen.findByText(/Crea el primer módulo/);
    fireEvent.change(screen.getByLabelText("Nuevo módulo"), { target: { value: " Módulo nuevo " } });
    fireEvent.click(screen.getByRole("button", { name: "Crear módulo" }));
    await waitFor(() => expect(apiService.modules.create).toHaveBeenCalledWith({ idCourse: "c-new", title: "Módulo nuevo" }));
    await waitFor(() => expect(screen.getByLabelText("Módulo de la nueva lección")).toHaveValue("m-new"));
    fireEvent.change(screen.getByLabelText("Nueva lección"), { target: { value: "Lección nueva" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear lección" }));
    await waitFor(() => expect(apiService.lessons.create).toHaveBeenCalledWith({ idModule: "m-new", title: "Lección nueva" }));
    await screen.findByText(/Lección creada/);
  });
  it("keeps input and announces a failed save", async () => {
    vi.mocked(apiService.modules.getByCourse).mockResolvedValue([]);
    vi.mocked(apiService.modules.create).mockRejectedValue(new Error("No hay conexión"));
    render(<CourseStructure courseId="c" />);
    await screen.findByText(/Crea el primer módulo/);
    fireEvent.change(screen.getByLabelText("Nuevo módulo"), { target: { value: "Mi módulo" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear módulo" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No hay conexión");
    expect(screen.getByLabelText("Nuevo módulo")).toHaveValue("Mi módulo");
  });
});
