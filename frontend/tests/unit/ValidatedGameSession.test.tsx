import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { NeonFlowStage } from "../../src/ui/components/NeonFlow/NeonFlowStage";
import { TetriLogicStage } from "../../src/ui/components/TetriLogic/TetriLogicStage";
import { NEONFLOW_LEVELS, LEGACY_NEONFLOW_LEVELS, TETRILOGIC_LEVELS } from "../../src/shared/constants/levelConfigs";
import { getAuthState } from "../../src/infrastructure/store/authStore";
import { gameProgressService } from "../../src/infrastructure/api/gameProgressService";
import { useGameStore } from "../../src/infrastructure/store/gameStore";
import { useAchievementStore } from "../../src/infrastructure/store/achievementStore";
import { ValidatedGameSession } from "../../src/infrastructure/store/validatedGameSession";
import type { GameSessionContext, GameSessionDTO, GameVictoryDTO } from "../../src/infrastructure/api/models/gameProgressModels";
import tetriSolutions from "../fixtures/tetrilogicSolutions.json";

vi.mock("../../src/infrastructure/store/authStore", () => ({ getAuthState: vi.fn() }));
vi.mock("../../src/infrastructure/api/gameProgressService", () => ({ gameProgressService: { active:vi.fn().mockResolvedValue(null), start: vi.fn(), action: vi.fn(), complete: vi.fn() } }));
vi.mock("../../src/infrastructure/api/axiosInstance", () => ({ default: { post: vi.fn().mockResolvedValue({ status: 201 }) } }));
const sessions = new Map<string, GameSessionDTO>();
const context = (): GameSessionContext => ({ studentId: getAuthState().user!.id, game: "neonflow", levelTemplate: "neonflow-v2-1" });
const sessionDTO = (value: GameSessionContext, id = crypto.randomUUID()): GameSessionDTO => ({ sessionId: id, game: value.game, levelNumber: 1, levelTemplate: value.levelTemplate, ruleset: "test-rules", startedAt: "2026-11-02T12:00:00Z", status: "ACTIVE", revision: 0, state: { pieces: [], moves: 0, resets: 0, helps: 0, failedChecks: 0, rejections: 0 } });
const victoryDTO = (id: string): GameVictoryDTO => ({ sessionId: id, game: sessions.get(id)?.game ?? "neonflow", levelNumber: 1, stars: 2, bestStars: 3, completedAt: "2026-11-02T12:01:00Z", durationMs: 60000, newAchievements: [], daily: null });
beforeEach(() => {
  vi.clearAllMocks(); sessions.clear();
  vi.mocked(getAuthState).mockReturnValue({ user: { id: crypto.randomUUID(), name: "Alumno", email: "test@example.com", role: "student" }, isAuthenticated: true });
  useAchievementStore.setState({ revisions: {}, notifications: [], seen: {} });
  vi.mocked(gameProgressService.start).mockImplementation(async value => { const session = sessionDTO(value); sessions.set(session.sessionId, session); return session; });
  vi.mocked(gameProgressService.action).mockImplementation(async (id, action) => { const session = { ...sessions.get(id)!, revision: action.sequence }; sessions.set(id, session); return session; });
  vi.mocked(gameProgressService.complete).mockImplementation(async id => victoryDTO(id));
});
afterEach(async () => { cleanup(); useGameStore.getState().stopGame(); await act(async () => {}); });
const openNeon = () => render(<MemoryRouter><NeonFlowStage levels={[NEONFLOW_LEVELS[0]]} /></MemoryRouter>);

describe("Server-confirmed game sessions", () => {
  it("uses the selected practice board from the URL when recovering a session",async()=>{
    const second={...context(),levelTemplate:"neonflow-v2-2"};
    const saved=sessionDTO(second);saved.levelNumber=2;saved.revision=1;saved.state.pieces=[{type:"MIRROR_90",x:1,y:2,rotation:0}];
    sessions.set(saved.sessionId,saved);vi.mocked(gameProgressService.active).mockResolvedValueOnce(saved);
    render(<MemoryRouter initialEntries={["/simulador/neonflow?level=2"]}><NeonFlowStage/></MemoryRouter>);
    expect(await screen.findByRole("button",{name:/^Rotar espejo, fila 3, columna 2/})).toBeInTheDocument();
    expect(screen.getByLabelText("Seleccionar nivel")).toHaveValue("1");
    expect(gameProgressService.active).toHaveBeenCalledWith(second);expect(gameProgressService.start).not.toHaveBeenCalled();
  });
  it("restores a saved Neon board and continues at the next acknowledged sequence",async()=>{
    const saved=sessionDTO(context());saved.revision=7;saved.state={...saved.state,moves:3,pieces:[{type:"MIRROR_90",x:1,y:0,rotation:90}]};
    sessions.set(saved.sessionId,saved);vi.mocked(gameProgressService.active).mockResolvedValueOnce(saved);
    openNeon();const mirror=await screen.findByRole("button",{name:/^Rotar espejo, fila 1, columna 2/});
    expect(gameProgressService.start).not.toHaveBeenCalled();expect(gameProgressService.action).not.toHaveBeenCalled();
    fireEvent.click(mirror);await waitFor(()=>expect(gameProgressService.action).toHaveBeenCalledWith(saved.sessionId,expect.objectContaining({sequence:8,type:"ROTATE",rotation:180})));
  });
  it("keeps the board unavailable when recovery fails instead of replacing the saved attempt",async()=>{
    vi.mocked(gameProgressService.active).mockRejectedValueOnce(new Error("Sin conexión"));openNeon();await screen.findByRole("alert");
    expect(gameProgressService.start).not.toHaveBeenCalled();expect(screen.queryByLabelText("Tablero Neon Flow")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button",{name:"Reintentar envío"}));await screen.findByLabelText("Tablero Neon Flow");
  });
  it("prepares exactly one persisted session in StrictMode before enabling interaction", async () => {
    let resolve!: (session: GameSessionDTO) => void;
    vi.mocked(gameProgressService.start).mockImplementationOnce(() => new Promise(done => { resolve = done; }));
    render(<StrictMode><MemoryRouter><NeonFlowStage levels={[NEONFLOW_LEVELS[0]]} /></MemoryRouter></StrictMode>);
    expect(screen.queryByLabelText("Tablero Neon Flow")).not.toBeInTheDocument();
    await waitFor(() => expect(gameProgressService.start).toHaveBeenCalledTimes(1));
    expect(gameProgressService.start).toHaveBeenCalledWith(expect.objectContaining({ studentId: getAuthState().user!.id, levelTemplate: "neonflow-v2-1" }), expect.stringMatching(/^[a-f\d-]{36}$/));
    resolve(sessionDTO(context()));
    expect(await screen.findByLabelText("Tablero Neon Flow")).toBeInTheDocument();
  });
  it("retries a failed start with the same UUID and keeps the board unavailable until acknowledged", async () => {
    vi.mocked(gameProgressService.start).mockRejectedValueOnce(new Error("Sin conexión"));
    openNeon();
    await screen.findByRole("alert");
    expect(screen.queryByRole("button", { name: "Comprobar" })).not.toBeInTheDocument();
    const uuid = vi.mocked(gameProgressService.start).mock.calls[0][1];
    fireEvent.click(screen.getByRole("button", { name: "Reintentar envío" }));
    await screen.findByLabelText("Tablero Neon Flow");
    expect(vi.mocked(gameProgressService.start).mock.calls[1][1]).toBe(uuid);
  });
  it("waits for ordered actions before confirming and displays only the server's stars", async () => {
    let acknowledge!: (session: GameSessionDTO) => void;
    vi.mocked(gameProgressService.action).mockImplementationOnce(() => new Promise(done => { acknowledge = done; }));
    let confirm!: (victory: GameVictoryDTO) => void;
    vi.mocked(gameProgressService.complete).mockImplementationOnce(() => new Promise(done => { confirm = done; }));
    openNeon(); await screen.findByLabelText("Tablero Neon Flow");
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
    await waitFor(() => expect(gameProgressService.action).toHaveBeenCalledTimes(1));
    expect(gameProgressService.action).toHaveBeenCalledWith(expect.any(String), { type: "CHECK", sequence: 1 });
    expect(gameProgressService.complete).not.toHaveBeenCalled();
    expect(screen.queryByText("Resultado guardado")).not.toBeInTheDocument();
    const id = vi.mocked(gameProgressService.action).mock.calls[0][0];
    acknowledge({ ...sessions.get(id)!, revision: 1 });
    await waitFor(() => expect(gameProgressService.complete).toHaveBeenCalledWith(id));
    expect(vi.mocked(gameProgressService.complete).mock.calls[0]).toHaveLength(1);
    confirm(victoryDTO(id));
    await screen.findByText("Resultado guardado");
    expect(screen.getByLabelText("2 de 3 estrellas")).toBeInTheDocument();
    expect(screen.getByText(/Mejor resultado: 3\/3/)).toBeInTheDocument();
  });
  it("retries an action with identical sequence and payload without resetting the local board", async () => {
    vi.mocked(gameProgressService.action).mockRejectedValueOnce(new Error("Sin conexión"));
    openNeon(); await screen.findByLabelText("Tablero Neon Flow");
    fireEvent.click(screen.getByRole("button", { name: "Espejo 90°" }));
    fireEvent.click(screen.getByRole("button", { name: "Celda vacía, fila 1, columna 2" }));
    await screen.findByRole("alert");
    const first = vi.mocked(gameProgressService.action).mock.calls[0];
    expect(screen.getByRole("button", { name: /^Rotar espejo, fila 1, columna 2/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar envío" }));
    await waitFor(() => expect(gameProgressService.action).toHaveBeenCalledTimes(2));
    expect(vi.mocked(gameProgressService.action).mock.calls[1]).toEqual(first);
    expect(screen.getByRole("button", { name: /^Rotar espejo, fila 1, columna 2/ })).toBeInTheDocument();
  });
  it("starts a new server session on reset after success rather than reusing the completed one", async () => {
    openNeon(); await screen.findByLabelText("Tablero Neon Flow");
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
    await screen.findByText("Resultado guardado");
    const firstId = vi.mocked(gameProgressService.start).mock.calls[0][1];
    fireEvent.click(screen.getByRole("button", { name: "Reiniciar" }));
    await screen.findByLabelText("Tablero Neon Flow");
    expect(gameProgressService.start).toHaveBeenCalledTimes(2);
    expect(vi.mocked(gameProgressService.start).mock.calls[1][1]).not.toBe(firstId);
    expect(screen.queryByText("Resultado guardado")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Comprobar" })).toBeEnabled();
  });
  it("confirms TetriLogic through accepted placements while keeping row and column rules", async () => {
    render(<MemoryRouter><TetriLogicStage levels={[TETRILOGIC_LEVELS[0]]} /></MemoryRouter>);
    await screen.findByLabelText("Tablero TetriLogic");
    for(const placement of tetriSolutions[0].placements){
      const piece=TETRILOGIC_LEVELS[0].inventory!.find(value=>value.id===placement.id)!;
      fireEvent.click(screen.getByRole("button",{name:`Seleccionar pieza ${piece.type} (${piece.id})`}));
      for(let angle=0;angle<placement.rotation;angle+=90)fireEvent.click(screen.getByRole("button",{name:"Rotar pieza"}));
      fireEvent.click(screen.getByRole("button",{name:`Celda vacía, fila ${placement.position.y+1}, columna ${placement.position.x+1}`}));
    }
    await waitFor(() => expect(gameProgressService.action).toHaveBeenCalledWith(expect.any(String), { type: "PLACE", pieceId: "o1", x: 0, y: 2, rotation: 0, sequence: 4 }));
    expect(screen.getByText("Reto completado.")).toBeInTheDocument();
    await screen.findByText("Resultado guardado");
  });
  it("keeps teacher previews and legacy prototypes playable without awarding progress", () => {
    vi.mocked(getAuthState).mockReturnValue({ user: { id: "teacher", name: "Docente", email: "teacher@example.com", role: "docente" }, isAuthenticated: true });
    const view = openNeon();
    expect(screen.getByLabelText("Tablero Neon Flow")).toBeInTheDocument();
    expect(gameProgressService.start).not.toHaveBeenCalled();
    view.unmount();
    vi.mocked(getAuthState).mockReturnValue({ user: { id: "legacy-student", name: "Alumno", email: "test@example.com", role: "student" }, isAuthenticated: true });
    render(<MemoryRouter><NeonFlowStage levels={[LEGACY_NEONFLOW_LEVELS[0]]} /></MemoryRouter>);
    expect(screen.getByLabelText("Tablero Neon Flow")).toBeInTheDocument();
    expect(gameProgressService.start).not.toHaveBeenCalled();
  });
  it("finishes a pending victory before a next board start can abandon its session", async () => {
    const first = new ValidatedGameSession(context());
    await first.start();
    let resolve!: (victory: GameVictoryDTO) => void;
    vi.mocked(gameProgressService.complete).mockImplementationOnce(() => new Promise(done => { resolve = done; }));
    first.complete();
    await waitFor(() => expect(gameProgressService.complete).toHaveBeenCalledTimes(1));
    const next = new ValidatedGameSession({ ...context(), levelTemplate: "neonflow-v2-2" });
    const pending = next.start();
    await act(async () => {});
    expect(gameProgressService.start).toHaveBeenCalledTimes(1);
    resolve(victoryDTO(first.getSnapshot().session!.sessionId));
    await pending;
    expect(gameProgressService.start).toHaveBeenCalledTimes(2);
  });
  it("serializes three rapid board starts so a delayed old request cannot abandon a newer one", async () => {
    const resolvers:Array<(session:GameSessionDTO)=>void>=[];
    vi.mocked(gameProgressService.start).mockImplementation(()=>new Promise(resolve=>{resolvers.push(resolve);}));
    const firstContext=context(),secondContext={...context(),levelTemplate:"neonflow-v2-2"},thirdContext={...context(),levelTemplate:"neonflow-v2-3"};
    const first=new ValidatedGameSession(firstContext),second=new ValidatedGameSession(secondContext),third=new ValidatedGameSession(thirdContext);
    const firstStart=first.start(),secondStart=second.start(),thirdStart=third.start();
    await act(async()=>{});
    expect(gameProgressService.start).toHaveBeenCalledTimes(1);
    resolvers[0](sessionDTO(firstContext));await firstStart;
    await waitFor(()=>expect(gameProgressService.start).toHaveBeenCalledTimes(2));
    expect(vi.mocked(gameProgressService.start).mock.calls[1][0].levelTemplate).toBe(secondContext.levelTemplate);
    resolvers[1](sessionDTO(secondContext));await secondStart;
    await waitFor(()=>expect(gameProgressService.start).toHaveBeenCalledTimes(3));
    expect(vi.mocked(gameProgressService.start).mock.calls[2][0].levelTemplate).toBe(thirdContext.levelTemplate);
    resolvers[2](sessionDTO(thirdContext));await thirdStart;
    expect(third.getSnapshot().phase).toBe("ready");
  });
  it("keeps retry payloads for an abandoned session but recovers through an explicit new attempt", async () => {
    vi.mocked(gameProgressService.action).mockRejectedValueOnce({response:{status:400,data:{message:"La sesión ya terminó."}}}).mockRejectedValueOnce({response:{status:400,data:{message:"La sesión ya terminó."}}});
    openNeon();await screen.findByLabelText("Tablero Neon Flow");
    fireEvent.click(screen.getByRole("button",{name:"Espejo 90°"}));fireEvent.click(screen.getByRole("button",{name:"Celda vacía, fila 1, columna 2"}));
    await screen.findByRole("alert");
    const failed=vi.mocked(gameProgressService.action).mock.calls[0],uuid=vi.mocked(gameProgressService.start).mock.calls[0][1];
    fireEvent.click(screen.getByRole("button",{name:"Reintentar envío"}));
    await waitFor(()=>expect(gameProgressService.action).toHaveBeenCalledTimes(2));
    expect(vi.mocked(gameProgressService.action).mock.calls[1]).toEqual(failed);
    expect(gameProgressService.complete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button",{name:"Reiniciar"}));
    await screen.findByLabelText("Tablero Neon Flow");
    expect(gameProgressService.start).toHaveBeenCalledTimes(2);
    expect(vi.mocked(gameProgressService.start).mock.calls[1][1]).not.toBe(uuid);
    expect(screen.queryByRole("button",{name:/^Rotar espejo/})).not.toBeInTheDocument();
  });
  it("offers a new UUID when replaying an initial start that was already abandoned", async () => {
    vi.mocked(gameProgressService.start).mockResolvedValueOnce({...sessionDTO(context()),status:"ABANDONED"});
    openNeon();await screen.findByRole("alert");
    const uuid=vi.mocked(gameProgressService.start).mock.calls[0][1];
    fireEvent.click(screen.getByRole("button",{name:"Nuevo intento"}));
    await screen.findByLabelText("Tablero Neon Flow");
    expect(vi.mocked(gameProgressService.start).mock.calls[1][1]).not.toBe(uuid);
  });
  it("retries a lost completion receipt without replaying accepted commands or inventing rewards", async () => {
    vi.mocked(gameProgressService.complete).mockRejectedValueOnce(new Error("Se perdió la respuesta"));
    openNeon();await screen.findByLabelText("Tablero Neon Flow");
    fireEvent.click(screen.getByRole("button",{name:"Comprobar"}));await screen.findByRole("alert");
    expect(screen.queryByText("Resultado guardado")).not.toBeInTheDocument();
    expect(useAchievementStore.getState().revisions[getAuthState().user!.id]).toBeUndefined();
    const id=vi.mocked(gameProgressService.complete).mock.calls[0][0];
    fireEvent.click(screen.getByRole("button",{name:"Reintentar envío"}));await screen.findByText("Resultado guardado");
    expect(gameProgressService.action).toHaveBeenCalledTimes(1);
    expect(vi.mocked(gameProgressService.complete).mock.calls).toEqual([[id],[id]]);
  });
});
