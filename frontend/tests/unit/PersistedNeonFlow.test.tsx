import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Simulador } from "../../src/ui/pages/Simulador";
import { PersistedNeonFlowStage } from "../../src/ui/components/NeonFlow/PersistedNeonFlowStage";
import { NEONFLOW_LEVELS, TETRILOGIC_LEVELS } from "../../src/shared/constants/levelConfigs";
import { loadCourseActivities } from "../../src/application/usecases/loadCourseActivities";
import axiosInstance from "../../src/infrastructure/api/axiosInstance";
import { useGameStore } from "../../src/infrastructure/store/gameStore";

vi.mock("../../src/application/usecases/loadCourseActivities", () => ({ loadCourseActivities: vi.fn() }));
vi.mock("../../src/infrastructure/api/axiosInstance", () => ({ default: { get: vi.fn(), post: vi.fn().mockResolvedValue({ status: 201 }) } }));
afterEach(() => { cleanup(); useGameStore.getState().stopGame(); vi.clearAllMocks(); });
const activity = { idActivity: "neon30", name: "Neon elegido", environment: "neonflow", levelTemplate: "neonflow-v2-30" };
const envelope = (config: (typeof NEONFLOW_LEVELS)[number]) => ({ data: { templateId: config.templateId, version: 2, config } });

describe("Persisted Neon Flow integration", () => {
  it("recovers from an unavailable backend only after loading the matching persisted board", async () => {
    const config = NEONFLOW_LEVELS[29];
    vi.mocked(axiosInstance.get).mockRejectedValueOnce(new Error("offline"));
    render(<MemoryRouter><PersistedNeonFlowStage config={config} activity={activity} /></MemoryRouter>);
    await screen.findByRole("alert");
    expect(screen.queryByRole("button", { name: "Comprobar" })).not.toBeInTheDocument();
    expect(useGameStore.getState().game).toBeNull();
    vi.mocked(axiosInstance.get).mockResolvedValueOnce(envelope(config));
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("heading", { name: activity.name })).toBeInTheDocument();
    expect(axiosInstance.get).toHaveBeenLastCalledWith("neonflow/templates/neonflow-v2-30", { signal: expect.any(AbortSignal) });
    expect(screen.getByLabelText("Tablero Neon Flow").querySelectorAll(".grid > *")).toHaveLength(config.width * config.height);
  });

  it.each([
    null,
    { templateId: "neonflow-v2-1", version: 2, config: NEONFLOW_LEVELS[29] },
    { templateId: "neonflow-v2-30", version: 1, config: NEONFLOW_LEVELS[29] },
    { templateId: "neonflow-v2-30", version: 2, config: { ...NEONFLOW_LEVELS[29], receptors: [] } },
  ])("rejects an incompatible envelope without silently using local configuration", async data => {
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data });
    render(<MemoryRouter><PersistedNeonFlowStage config={NEONFLOW_LEVELS[29]} activity={activity} /></MemoryRouter>);
    await screen.findByRole("alert");
    expect(screen.queryByLabelText("Tablero Neon Flow")).not.toBeInTheDocument();
    expect(useGameStore.getState().game).toBeNull();
  });

  it("hides the previous board while loading a new configuration and clears placed components", async () => {
    const first = NEONFLOW_LEVELS[0], last = NEONFLOW_LEVELS[29];
    vi.mocked(axiosInstance.get).mockResolvedValueOnce(envelope(first));
    const view = render(<MemoryRouter><PersistedNeonFlowStage config={first} activity={{ ...activity, levelTemplate: first.templateId }} /></MemoryRouter>);
    await screen.findByRole("heading", { name: activity.name });
    fireEvent.click(screen.getByRole("button", { name: "Espejo 90°" }));
    fireEvent.click(screen.getByRole("button", { name: "Celda vacía, fila 1, columna 2" }));
    expect(useGameStore.getState().movimientos).toBe(1);
    const firstSignal = vi.mocked(axiosInstance.get).mock.calls[0][1]?.signal;
    let resolveLast!: (value: ReturnType<typeof envelope>) => void;
    vi.mocked(axiosInstance.get).mockImplementationOnce(() => new Promise(resolve => { resolveLast = resolve; }));
    view.rerender(<MemoryRouter><PersistedNeonFlowStage config={last} activity={activity} /></MemoryRouter>);
    expect(firstSignal?.aborted).toBe(true);
    expect(screen.getByRole("status")).toHaveTextContent("Cargando tablero");
    expect(screen.queryByLabelText("Tablero Neon Flow")).not.toBeInTheDocument();
    expect(useGameStore.getState().game).toBeNull();
    resolveLast(envelope(last));
    await screen.findByRole("heading", { name: activity.name });
    expect(screen.queryByRole("button", { name: /^Rotar espejo/ })).not.toBeInTheDocument();
    expect(useGameStore.getState().movimientos).toBe(0);
  });

  it("ignores a stale response that arrives after another board has loaded", async () => {
    const first = NEONFLOW_LEVELS[0], last = NEONFLOW_LEVELS[29];
    let resolveFirst!: (value: ReturnType<typeof envelope>) => void;
    vi.mocked(axiosInstance.get).mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve; }));
    const view = render(<MemoryRouter><PersistedNeonFlowStage config={first} activity={{ ...activity, levelTemplate: first.templateId }} /></MemoryRouter>);
    const firstSignal = vi.mocked(axiosInstance.get).mock.calls[0][1]?.signal;
    vi.mocked(axiosInstance.get).mockResolvedValueOnce(envelope(last));
    view.rerender(<MemoryRouter><PersistedNeonFlowStage config={last} activity={activity} /></MemoryRouter>);
    await screen.findByRole("heading", { name: activity.name });
    expect(firstSignal?.aborted).toBe(true);
    await act(async () => { resolveFirst(envelope(first)); });
    expect(screen.getByLabelText("Tablero Neon Flow").querySelectorAll(".grid > *")).toHaveLength(last.width * last.height);
    expect(screen.getByRole("option", { name: "Nivel 30" })).toBeInTheDocument();
  });

  it("opens a compatible alias with canonical persisted geometry and switches to TetriLogic by activity", async () => {
    const neon = NEONFLOW_LEVELS[29], tetri = TETRILOGIC_LEVELS[0];
    vi.mocked(loadCourseActivities).mockResolvedValue([
      { ...activity, levelTemplate: "neonflow-30" },
      { idActivity: "tetri1", name: "Tetri elegido", environment: "tetrilogic", levelTemplate: tetri.templateId },
    ]);
    vi.mocked(axiosInstance.get).mockImplementation(async url => url.startsWith("neonflow/")
      ? envelope(neon) : { data: { templateId: tetri.templateId, version: 2, config: tetri } });
    render(<MemoryRouter initialEntries={["/simulador/mixed-course?activity=neon30"]}><Routes><Route path="/simulador/:courseId" element={<Simulador />} /></Routes></MemoryRouter>);
    await screen.findByRole("heading", { name: activity.name });
    expect(axiosInstance.get).toHaveBeenCalledWith("neonflow/templates/neonflow-v2-30", { signal: expect.any(AbortSignal) });
    fireEvent.change(screen.getByLabelText("Reto del curso"), { target: { value: "tetri1" } });
    await screen.findByRole("heading", { name: "Tetri elegido" });
    expect(screen.queryByLabelText("Tablero Neon Flow")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Tablero TetriLogic")).toBeInTheDocument();
    expect(useGameStore.getState().game).toBeNull();
  });
});
