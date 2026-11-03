import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { PaginaInicio } from "../../src/ui/pages/PaginaInicio";
import { apiService } from "../../src/infrastructure/api/apiService";
import { loadCourseActivities } from "../../src/application/usecases/loadCourseActivities";

vi.mock("../../src/infrastructure/api/apiService", () => ({ apiService: { courses: { getAll: vi.fn() } } }));
vi.mock("../../src/application/usecases/loadCourseActivities", () => ({ loadCourseActivities: vi.fn() }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
function Destination() { const location = useLocation(); return <p>Destino {location.pathname}{location.search}</p>; }
function open() {
  vi.mocked(apiService.courses.getAll).mockResolvedValue([{ idCourse: "custom-course", name: "Mi laboratorio" }]);
  render(<MemoryRouter><Routes><Route path="/" element={<PaginaInicio />} /><Route path="/simulador/:courseId" element={<Destination />} /></Routes></MemoryRouter>);
}

describe("Catalog entry to TetriLogic row/column challenges", () => {
  it("shows the current count goal without obsolete order/contact instructions while retaining activity identity", async () => {
    vi.mocked(loadCourseActivities).mockResolvedValue([{ idActivity: "custom-activity", name: "Nombre del docente", environment: "tetrilogic", levelTemplate: "tetrilogic-v2-30", displayOrder: 4, description: "Cumple conteos, orden y contactos.", difficulty: "HARD" }]);
    open(); fireEvent.click(await screen.findByRole("button", { name: /Mi laboratorio/ }));
    expect(await screen.findByText("1 reto disponible")).toBeInTheDocument();
    expect(screen.getByText("Reto 4 · Filas y columnas")).toBeInTheDocument();
    expect(screen.getByText(/6 × 6 · Iguala los objetivos/)).toBeInTheDocument();
    expect(screen.queryByText("Cumple conteos, orden y contactos.")).not.toBeInTheDocument();
    expect(screen.queryByText(/HARD/)).not.toBeInTheDocument();
    expect(screen.getByText("Nombre del docente")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Iniciar" }));
    expect(screen.getByText("Destino /simulador/custom-course?activity=custom-activity")).toBeInTheDocument();
  });
  it("retains Neon Flow instructions and explicit unavailable templates in a mixed course", async () => {
    vi.mocked(loadCourseActivities).mockResolvedValue([
      { idActivity: "neon", name: "Luz", environment: "neonflow", levelTemplate: "neonflow-1", description: "Guía el láser al receptor.", difficulty: "EASY" },
      { idActivity: "tetri", name: "Piezas", environment: "tetrilogic", levelTemplate: "tetrilogic-v2-1", description: "Antiguas reglas." },
      { idActivity: "unknown", name: "Sin configurar", environment: "tetrilogic", levelTemplate: "future-template" },
    ]);
    open(); fireEvent.click(await screen.findByRole("button", { name: /Mi laboratorio/ }));
    expect(await screen.findByText("3 actividades disponibles")).toBeInTheDocument();
    expect(screen.getByText("Guía el láser al receptor.")).toBeInTheDocument();
    expect(screen.getByText("Reto 1 · EASY")).toBeInTheDocument();
    expect(screen.getByText("Reto 2 · Filas y columnas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tablero pendiente" })).toBeDisabled();
  });
});
