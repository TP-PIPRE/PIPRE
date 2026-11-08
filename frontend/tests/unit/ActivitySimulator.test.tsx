import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { Simulador } from "../../src/ui/pages/Simulador";
import { loadCourseActivities } from "../../src/application/usecases/loadCourseActivities";
import { useGameStore } from "../../src/infrastructure/store/gameStore";
import { getAuthState } from "../../src/infrastructure/store/authStore";
vi.mock("../../src/application/usecases/loadCourseActivities", () => ({ loadCourseActivities: vi.fn() }));
vi.mock("../../src/infrastructure/store/authStore", () => ({ getAuthState: vi.fn() }));
vi.mock("../../src/ui/components/common/useValidatedGameSession", () => {
  const session={enabled:false,state:null,ready:true,verifying:false,action:()=>{},complete:()=>{},retry:()=>{},reset:()=>{}};
  return {useValidatedGameSession:()=>session};
});
beforeEach(() => { vi.mocked(getAuthState).mockReturnValue({ user: { id: "s", name: "Alumno", email: "alumno@example.com", role: "student" }, isAuthenticated: true }); });
afterEach(() => { cleanup(); useGameStore.getState().stopGame(); vi.clearAllMocks(); });
function ManagementDestination() { const location = useLocation(); return <p>Gestión del curso {location.state?.courseId}</p>; }
function open(path: string) { render(<MemoryRouter initialEntries={[path]}><Link to="/simulador">Abrir simulador sin seleccionar curso</Link><Routes><Route path="/simulador/:courseId?" element={<Simulador />} /><Route path="/docente/retos" element={<ManagementDestination />} /></Routes></MemoryRouter>); }
describe("Backend activity selection", () => {
  it("plays the selected TetriLogic activity inside an official course", async () => {
    vi.mocked(loadCourseActivities).mockResolvedValue([
      { idActivity: "a-neon", name: "Luz", environment: "neonflow", levelTemplate: "neonflow-1" },
      { idActivity: "a-tetri", name: "Mi reto espacial", environment: "tetrilogic", levelTemplate: "tetrilogic-1", description: "Instrucciones guardadas" },
    ]);
    open("/simulador/c002?activity=a-tetri");
    expect(await screen.findByRole("heading", { name: "Mi reto espacial" })).toBeInTheDocument();
    expect(screen.queryByText("Instrucciones guardadas")).not.toBeInTheDocument();
    expect(screen.getByText("Filas y columnas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Seleccionar pieza O (o1)" })).toBeInTheDocument();
    expect(loadCourseActivities).toHaveBeenCalledWith("c002");
  });
  it("does not replace an unknown template with an unrelated game", async () => {
    vi.mocked(loadCourseActivities).mockResolvedValue([{ idActivity: "a", name: "Sin tablero", environment: "neonflow", levelTemplate: "unknown" }]);
    open("/simulador/c002?activity=a");
    expect(await screen.findByRole("heading", { name: "Este reto aún no está listo para jugar" })).toBeInTheDocument();
    expect(screen.getByText(/por parte de tu docente/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Configurar tablero" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Comprobar" })).not.toBeInTheDocument();
  });
  it("does not reopen deleted courses or attach their activities to practice aliases", () => {
    open("/simulador/logica?activity=deleted-activity");
    expect(screen.getByRole("heading", { name: "Este curso ya no está disponible" })).toBeInTheDocument();
    expect(loadCourseActivities).not.toHaveBeenCalled();
  });
  it("rejects an activity outside the requested course", async () => {
    vi.mocked(loadCourseActivities).mockResolvedValue([{ idActivity: "a", name: "Propio", environment: "neonflow", levelTemplate: "neonflow-1" }]);
    open("/simulador/c002?activity=other-course-activity");
    expect(await screen.findByText(/no pertenece a este curso/)).toBeInTheDocument();
  });
  it.each([403,404])("shows a recoverable load error for HTTP %s without opening a substitute board", async status => {
    vi.mocked(loadCourseActivities).mockRejectedValueOnce({response:{status,data:{message:"El curso no está disponible."}}});
    open("/simulador/c002?activity=deleted-activity");
    expect(await screen.findByRole("heading",{name:"No pudimos cargar los retos"})).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByLabelText("Tablero Neon Flow")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Tablero TetriLogic")).not.toBeInTheDocument();
    vi.mocked(loadCourseActivities).mockResolvedValueOnce([]);
    fireEvent.click(screen.getByRole("button",{name:"Reintentar"}));
    expect(await screen.findByRole("heading",{name:"No encontramos este reto"})).toBeInTheDocument();
  });
  it("opens free exploration directly without requiring a course or a challenge", () => {
    open("/simulador");
    expect(screen.getByRole("heading", { name: "TetriLogic" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Seleccionar tablero" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Comprobar" })).not.toBeInTheDocument();
    expect(loadCourseActivities).not.toHaveBeenCalled();
  });
  it("distinguishes an empty course from an activity awaiting configuration", async () => {
    vi.mocked(loadCourseActivities).mockResolvedValue([]);
    open("/simulador/c002");
    expect(await screen.findByRole("heading", { name: "Este curso aún no tiene retos" })).toBeInTheDocument();
    expect(screen.getByText(/todavía no ha añadido retos/)).toBeInTheDocument();
  });
  it("does not keep the previous board after returning to the general simulator menu", async () => {
    vi.mocked(loadCourseActivities).mockResolvedValue([{ idActivity: "a", name: "Tablero anterior", environment: "neonflow", levelTemplate: "neonflow-1" }]);
    open("/simulador/c002?activity=a");
    await screen.findByRole("heading", { name: "Tablero anterior" });
    fireEvent.click(screen.getByRole("link", { name: "Abrir simulador sin seleccionar curso" }));
    expect(screen.getByRole("heading", { name: "TetriLogic" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Tablero anterior" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Comprobar" })).not.toBeInTheDocument();
    expect(useGameStore.getState().status).toBe("IDLE");
  });
  it.each(["docente", "admin"] as const)("directs %s to configuration with the right course selected", async role => {
    vi.mocked(getAuthState).mockReturnValue({ user: { id: "t", name: "Docente", email: "docente@example.com", role }, isAuthenticated: true });
    vi.mocked(loadCourseActivities).mockResolvedValue([{ idActivity: "a", name: "Sin tablero", environment: "neonflow" }]);
    open("/simulador/c002?activity=a");
    fireEvent.click(await screen.findByRole("link", { name: "Configurar tablero" }));
    expect(screen.getByText("Gestión del curso c002")).toBeInTheDocument();
  });
});
