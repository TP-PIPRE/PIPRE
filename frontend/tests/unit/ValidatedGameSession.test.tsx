import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { NeonFlowStage } from "../../src/ui/components/NeonFlow/NeonFlowStage";
import { TetriLogicStage } from "../../src/ui/components/TetriLogic/TetriLogicStage";
import { NEONFLOW_LEVELS, LEGACY_NEONFLOW_LEVELS, TETRILOGIC_LEVELS } from "../../src/shared/constants/levelConfigs";
import { NEON_FLOW_TIPS, TETRILOGIC_TIPS } from "../../src/shared/constants/boardTips";
import { getAuthState } from "../../src/infrastructure/store/authStore";
import { gameProgressService } from "../../src/infrastructure/api/gameProgressService";
import { useGameStore } from "../../src/infrastructure/store/gameStore";
import { useAchievementStore } from "../../src/infrastructure/store/achievementStore";
import { ValidatedGameSession } from "../../src/infrastructure/store/validatedGameSession";
import type { ActivityResponseDTO } from "../../src/infrastructure/api/models/apiModels";
import type { GameProgressDTO, GameSessionContext, GameSessionDTO, GameVictoryDTO, ProgressiveHint, ProgressiveHintRequest } from "../../src/infrastructure/api/models/gameProgressModels";
import { Simulador } from "../../src/ui/pages/Simulador";
import { loadCourseActivities } from "../../src/application/usecases/loadCourseActivities";
import axiosInstance from "../../src/infrastructure/api/axiosInstance";
import tetriSolutions from "../fixtures/tetrilogicSolutions.json";

vi.mock("../../src/infrastructure/store/authStore", () => ({ getAuthState: vi.fn() }));
vi.mock("../../src/infrastructure/api/gameProgressService", () => ({ gameProgressService: { active:vi.fn().mockResolvedValue(null), start: vi.fn(), action: vi.fn(), complete: vi.fn(), hint: vi.fn(), progress: vi.fn(), progressiveHint: vi.fn(), progressiveHintProgress: vi.fn() } }));
vi.mock("../../src/infrastructure/api/axiosInstance", () => ({ default: { get: vi.fn(), post: vi.fn().mockResolvedValue({ status: 201 }) } }));
vi.mock("../../src/application/usecases/loadCourseActivities", () => ({ loadCourseActivities: vi.fn() }));
const sessions = new Map<string, GameSessionDTO>();
const context = (): GameSessionContext => ({ studentId: getAuthState().user!.id, game: "neonflow", levelTemplate: "neonflow-v2-1" });
const sessionDTO = (value: GameSessionContext, id = crypto.randomUUID()): GameSessionDTO => ({ sessionId: id, game: value.game, levelNumber: 1, levelTemplate: value.levelTemplate, ruleset: "test-rules", startedAt: "2026-11-02T12:00:00Z", status: "ACTIVE", revision: 0, state: { pieces: [], moves: 0, resets: 0, helps: 0, failedChecks: 0, rejections: 0 } });
const officialActivity: ActivityResponseDTO = { idActivity: "activity-1", name: "Reto oficial", environment: "neonflow", levelTemplate: "neonflow-v2-1" };
const officialContext = (): GameSessionContext => ({ ...context(), activityId: officialActivity.idActivity });
const victoryDTO = (id: string): GameVictoryDTO => ({ sessionId: id, game: sessions.get(id)?.game ?? "neonflow", levelNumber: 1, stars: 2, bestStars: 3, completedAt: "2026-11-02T12:01:00Z", durationMs: 60000, newAchievements: [], daily: null });
beforeEach(() => {
  vi.clearAllMocks(); sessions.clear();
  vi.mocked(getAuthState).mockReturnValue({ user: { id: crypto.randomUUID(), name: "Alumno", email: "test@example.com", role: "student" }, isAuthenticated: true });
  useAchievementStore.setState({ revisions: {}, notifications: [], seen: {} });
  vi.mocked(gameProgressService.start).mockImplementation(async value => { const session = sessionDTO(value); sessions.set(session.sessionId, session); return session; });
  vi.mocked(gameProgressService.action).mockImplementation(async (id, action) => {
    const previous = sessions.get(id)!;
    const helps = action.type === "HELP" && action.sequence > previous.revision ? previous.state.helps + 1 : previous.state.helps;
    const session = { ...previous, revision: action.sequence, state: { ...previous.state, helps } };
    sessions.set(id, session);
    return session;
  });
  vi.mocked(gameProgressService.complete).mockImplementation(async id => victoryDTO(id));
  vi.mocked(gameProgressService.hint).mockImplementation(async (_sessionId, request) => ({ requestId: request.requestId, hintId: crypto.randomUUID(), revision: request.revision, source: "RULE_BASED", hintLevel: 1, type: "COLOR_HINT", message: "Observa el filtro del haz.", targetCell: { x: 1, y: 1 } }));
});
afterEach(async () => { cleanup(); useGameStore.getState().stopGame(); await act(async () => {}); });
const openNeon = () => render(<MemoryRouter><NeonFlowStage levels={[NEONFLOW_LEVELS[0]]} /></MemoryRouter>);
const progressView = (levels: GameProgressDTO["levels"] = []): GameProgressDTO => ({
  levels, completedLevels: levels.length, totalLevels: 60, totalStars: levels.length, currentStreak: 0, bestStreak: 0,
});
function openCourse(path: string) {
  render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/simulador/:courseId" element={<Simulador />} /></Routes></MemoryRouter>);
}
function mockCourse(game: "neonflow" | "tetrilogic", levels: number[]) {
  vi.mocked(loadCourseActivities).mockResolvedValue(levels.map(level => ({
    idActivity: `a${level}`, name: `Reto ${level}`, description: "Objetivo del reto", environment: game, levelTemplate: `${game}-v2-${level}`,
  })));
  vi.mocked(axiosInstance.get).mockImplementation(async url => {
    const config = (game === "neonflow" ? NEONFLOW_LEVELS : TETRILOGIC_LEVELS).find(level => url.endsWith(level.templateId!))!;
    return { data: { templateId: config.templateId, version: 2, config } };
  });
}
function solveTetriLevelOne() {
  for (const placement of tetriSolutions[0].placements) {
    const piece = TETRILOGIC_LEVELS[0].inventory!.find(value => value.id === placement.id)!;
    fireEvent.click(screen.getByRole("button", { name: `Seleccionar pieza ${piece.type} (${piece.id})` }));
    for (let angle = 0; angle < placement.rotation; angle += 90) fireEvent.click(screen.getByRole("button", { name: "Rotar pieza" }));
    fireEvent.click(screen.getByRole("button", { name: `Celda vacía, fila ${placement.position.y + 1}, columna ${placement.position.x + 1}` }));
  }
}

function openProgressiveGame(game: "neonflow" | "tetrilogic" = "neonflow") {
  let lastHint: ProgressiveHint | null = null;
  const deliver = (request: ProgressiveHintRequest) => {
    lastHint = { requestId: request.requestId, ordinal: request.ordinal, message: `Consejo ${request.ordinal}`, source: request.ordinal <= 5 ? "STATIC" : "GENERATIVE" };
    return lastHint;
  };
  vi.mocked(gameProgressService.start).mockImplementationOnce(async value => {
    const session = sessionDTO(value);
    if (game === "tetrilogic") session.state.progressiveTutor = true;
    else session.state.neonFlowProgressiveTutor = true;
    sessions.set(session.sessionId, session);
    return session;
  });
  vi.mocked(gameProgressService.progressiveHintProgress).mockImplementation(async () => ({ deliveredCount: lastHint?.ordinal ?? 0, lastHint, generating: false }));
  vi.mocked(gameProgressService.progressiveHint).mockImplementation(async (_id, request) => deliver(request));
  const stage = <MemoryRouter>{game === "tetrilogic"
    ? <TetriLogicStage levels={[TETRILOGIC_LEVELS[0]]} activity={{ idActivity: "act-c002-1", name: "TetriLogic", environment: game, levelTemplate: "tetrilogic-v2-1" }} />
    : <NeonFlowStage levels={[NEONFLOW_LEVELS[0]]} activity={officialActivity} />}</MemoryRouter>;
  return { deliver, stage, ...render(stage) };
}

describe("Progressive advice", () => {
  it.each(["neonflow", "tetrilogic"] as const)("shows the warning only at the ninth tip in %s", async game => {
    openProgressiveGame(game);
    const hintButton = await screen.findByRole("button", { name: "Pista" });
    await waitFor(() => expect(hintButton).not.toHaveAttribute("aria-disabled"));
    for (let ordinal = 1; ordinal <= 8; ordinal++) {
      fireEvent.click(hintButton);
      expect(await screen.findByText(`Consejo ${ordinal}`)).toBeInTheDocument();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(gameProgressService.progressiveHint).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({ ordinal, acceptPenalty: false }), expect.any(AbortSignal));
    }

    fireEvent.click(hintButton);
    const warning = await screen.findByRole("dialog", { name: "Consejo adicional" });
    fireEvent.click(within(warning).getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(gameProgressService.progressiveHint).toHaveBeenCalledTimes(8);

    fireEvent.click(hintButton);
    fireEvent.click(await screen.findByRole("button", { name: "Recibir consejo" }));
    expect(await screen.findByText("Consejo 9")).toBeInTheDocument();
    expect(gameProgressService.progressiveHint).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({ ordinal: 9, acceptPenalty: true }), expect.any(AbortSignal));
    expect(gameProgressService.action).not.toHaveBeenCalled();
  });

  it("freezes the board during generation and recovers a lost delivery without charging it twice", async () => {
    const { deliver } = openProgressiveGame();
    for (let ordinal = 1; ordinal <= 5; ordinal++) deliver({ requestId: crypto.randomUUID(), ordinal, revision: 0, acceptPenalty: false });
    const hintButton = await screen.findByRole("button", { name: "Pista" });
    await waitFor(() => expect(hintButton).not.toHaveAttribute("aria-disabled"));
    let finish!: () => void;
    vi.mocked(gameProgressService.progressiveHint).mockImplementationOnce((_id, request) => new Promise((_resolve, reject) => {
      finish = () => {
        deliver(request);
        reject(new Error("Respuesta perdida"));
      };
    }));

    fireEvent.click(hintButton);
    await waitFor(() => expect(gameProgressService.progressiveHint).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "Comprobar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reiniciar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Espejo 90°" })).toBeDisabled();
    fireEvent.click(hintButton);
    finish();

    expect(await screen.findByText("Consejo 6")).toBeInTheDocument();
    expect(gameProgressService.progressiveHint).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Espejo 90°" })).toBeEnabled();
  });

  it("pauses TetriLogic pieces and keyboard shortcuts during generation", async () => {
    const { deliver } = openProgressiveGame("tetrilogic");
    deliver({ requestId: crypto.randomUUID(), ordinal: 5, revision: 0, acceptPenalty: false });
    const hintButton = await screen.findByRole("button", { name: "Pista" });
    await waitFor(() => expect(hintButton).not.toHaveAttribute("aria-disabled"));
    const piece = screen.getByRole("button", { name: "Seleccionar pieza I (i1)" });
    fireEvent.click(piece);
    let completeHint!: () => void;
    vi.mocked(gameProgressService.progressiveHint).mockImplementationOnce((_id, request) => new Promise(resolve => {
      completeHint = () => resolve(deliver(request));
    }));
    fireEvent.click(hintButton);
    await waitFor(() => expect(gameProgressService.progressiveHint).toHaveBeenCalledTimes(1));
    expect(piece).toBeDisabled();
    expect(screen.getByRole("button", { name: "Rotar pieza" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Celda vacía, fila 1, columna 1" })).toBeDisabled();
    fireEvent.keyDown(hintButton, { key: "r" });
    expect(gameProgressService.action).not.toHaveBeenCalled();
    completeHint();
    await screen.findByText("Consejo 6");
    expect(piece).toBeEnabled();
    fireEvent.keyDown(hintButton, { key: "r" });
    await waitFor(() => expect(gameProgressService.action).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ type: "ROTATE" })));
  });

  it("keeps the same request when retrying an uncertain result after remounting the board", async () => {
    const { stage, unmount } = openProgressiveGame();
    vi.mocked(gameProgressService.progressiveHint).mockRejectedValueOnce(new Error("Conexión perdida"));
    const hintButton = await screen.findByRole("button", { name: "Pista" });
    await waitFor(() => expect(hintButton).not.toHaveAttribute("aria-disabled"));
    fireEvent.click(hintButton);
    await screen.findByText("No pudimos preparar el consejo. Puedes volver a intentarlo.");
    const [id, original] = vi.mocked(gameProgressService.progressiveHint).mock.calls[0];

    unmount();
    vi.mocked(gameProgressService.active).mockResolvedValueOnce(sessions.get(id)!);
    render(stage);
    const resumed = await screen.findByRole("button", { name: "Pista" });
    await waitFor(() => expect(resumed).not.toHaveAttribute("aria-disabled"));
    fireEvent.click(resumed);
    expect(await screen.findByText("Consejo 1")).toBeInTheDocument();
    expect(gameProgressService.progressiveHint).toHaveBeenLastCalledWith(id, original, expect.any(AbortSignal));
  });
});

describe("Official course progression and access", () => {
  it.each([["neonflow", "c001", "Neon Flow"], ["tetrilogic", "c002", "TetriLogic"]] as const)(
    "refreshes confirmed %s progress and opens the next unlocked level", async (game, course, label) => {
      mockCourse(game, [1, 3, 2]);
      let finishRefresh!: (value: GameProgressDTO) => void;
      vi.mocked(gameProgressService.progress).mockResolvedValueOnce(progressView())
        .mockImplementationOnce(() => new Promise(resolve => { finishRefresh = resolve; }));
      openCourse(`/simulador/${course}?activity=a1`);
      await screen.findByLabelText(`Tablero ${label}`);
      if (game === "tetrilogic") solveTetriLevelOne();
      else fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
      await screen.findByText("Resultado guardado");
      expect(screen.getByText("Consultando progreso…")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Siguiente reto" })).not.toBeInTheDocument();
      await act(async () => finishRefresh(progressView([{ game, levelNumber: 1, completed: true, bestStars: 3 }])));
      fireEvent.click(await screen.findByRole("button", { name: "Siguiente reto" }));
      await screen.findByRole("heading", { name: "Reto 2" });
      await waitFor(() => expect(gameProgressService.start).toHaveBeenLastCalledWith(
        expect.objectContaining({ activityId: "a2", levelTemplate: `${game}-v2-2` }), expect.any(String),
      ));
      expect(screen.queryByRole("heading", { name: "Nivel bloqueado" })).not.toBeInTheDocument();
    },
  );

  it.each([["neonflow", "c001", "Neon Flow"], ["tetrilogic", "c002", "TetriLogic"]] as const)("keeps the %s preview read-only even if progress cannot be verified", async (game, course, label) => {
    mockCourse(game, [1, 2]);
    vi.mocked(gameProgressService.progress).mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(progressView());
    openCourse(`/simulador/${course}?activity=a2`);
    expect(await screen.findByText(/No pudimos verificar tu progreso/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Progreso por confirmar" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Nivel bloqueado" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar progreso" }));
    await screen.findByRole("heading", { name: "Nivel bloqueado" });
    expect(screen.getByRole("option", { name: /Reto 2 · bloqueado/ })).toBeEnabled();
    const preview = await screen.findByRole("region", { name: `Vista previa de ${label}` });
    expect(within(preview).getByLabelText(`Tablero ${label}`)).toBeVisible();
    for (const control of within(preview).getAllByRole("button")) {
      expect(control).toBeDisabled();
      expect(control).not.toHaveAttribute("draggable", "true");
    }
    expect(axiosInstance.get).toHaveBeenCalledWith(`${game}/templates/${game}-v2-2`, expect.anything());
    expect(gameProgressService.active).not.toHaveBeenCalled();
    expect(gameProgressService.start).not.toHaveBeenCalled();
  });

  it("opens a playable board directly and offers no next action on the last level", async () => {
    mockCourse("neonflow", [1]);
    vi.mocked(gameProgressService.progress).mockResolvedValue(progressView());
    openCourse("/simulador/c001?activity=a1");
    await screen.findByLabelText("Tablero Neon Flow");
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
    await screen.findByText("Resultado guardado");
    await waitFor(() => expect(screen.queryByText("Consultando progreso…")).not.toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Siguiente reto" })).not.toBeInTheDocument();
  });

  it.each(["docente", "admin"] as const)("lets %s try a higher level locally without requiring student progress", async role => {
    mockCourse("tetrilogic", [2]);
    vi.mocked(getAuthState).mockReturnValue({ user: { id: "teacher", name: "Docente", email: "teacher@example.com", role }, isAuthenticated: true });
    openCourse("/simulador/c002?activity=a2");
    expect(await screen.findByLabelText("Tablero TetriLogic")).toBeInTheDocument();
    expect(gameProgressService.progress).not.toHaveBeenCalled();
    expect(gameProgressService.start).not.toHaveBeenCalled();
  });
});

describe("Server-confirmed game sessions", () => {
  it("requests a contextual hint at the confirmed revision and queues one HELP action", async () => {
    const controller = new ValidatedGameSession(officialContext());
    await controller.start();
    expect(await controller.requestHint()).toMatchObject({ status: "DELIVERED", hint: { message: "Observa el filtro del haz." } });
    expect(gameProgressService.hint).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ revision: 0, locale: "es" }));
    await waitFor(() => expect(gameProgressService.action).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ type: "HELP", hintId: expect.any(String), sequence: 1 })));
  });

  it("keeps the same requestId and avoids static HELP when contextual delivery is uncertain", async () => {
    const controller = new ValidatedGameSession(officialContext());
    await controller.start();
    vi.mocked(gameProgressService.hint).mockRejectedValueOnce(new Error("Sin conexión"));

    const first = await controller.requestHint();

    expect(first.status).toBe("PENDING");
    expect(gameProgressService.action).not.toHaveBeenCalled();
    const requestId = vi.mocked(gameProgressService.hint).mock.calls[0][1].requestId;
    vi.mocked(gameProgressService.hint).mockImplementationOnce(async (_sessionId, request) => ({
      requestId: request.requestId, hintId: crypto.randomUUID(), revision: request.revision, source: "RULE_BASED", hintLevel: 1,
      type: "COLOR_HINT", message: "Observa el filtro del haz.", targetCell: { x: 1, y: 1 },
    }));

    const second = await controller.requestHint();

    expect(second.status).toBe("DELIVERED");
    expect(vi.mocked(gameProgressService.hint).mock.calls[1][1].requestId).toBe(requestId);
    expect(vi.mocked(gameProgressService.action).mock.calls).toHaveLength(1);
  });

  it("retries a failed contextual action with the same hint and sequence", async () => {
    const controller = new ValidatedGameSession(officialContext());
    await controller.start();
    vi.mocked(gameProgressService.action).mockRejectedValueOnce(new Error("Sin conexión"));

    const first = await controller.requestHint();

    expect(first.status).toBe("PENDING");
    const failedAction = vi.mocked(gameProgressService.action).mock.calls[0][1];
    const second = await controller.requestHint();

    expect(second.status).toBe("DELIVERED");
    expect(vi.mocked(gameProgressService.action).mock.calls[1][1]).toEqual(failedAction);
  });

  it("returns the delivered hint through the generic retry action", async () => {
    const controller = new ValidatedGameSession(officialContext());
    await controller.start();
    vi.mocked(gameProgressService.action).mockRejectedValueOnce(new Error("Sin conexión"));

    expect((await controller.requestHint()).status).toBe("PENDING");
    const result = await controller.retry();

    expect(result?.status).toBe("DELIVERED");
  });

  it("does not send a pending hint after the session is disposed", async () => {
    const controller = new ValidatedGameSession(officialContext());
    await controller.start();
    let resolveHint!: (value: Awaited<ReturnType<typeof gameProgressService.hint>>) => void;
    vi.mocked(gameProgressService.hint).mockImplementationOnce(() => new Promise(resolve => { resolveHint = resolve; }));

    const pending = controller.requestHint();
    await waitFor(() => expect(gameProgressService.hint).toHaveBeenCalledTimes(1));
    controller.dispose();
    resolveHint({ requestId: vi.mocked(gameProgressService.hint).mock.calls[0][1].requestId, hintId: crypto.randomUUID(), revision: 0, source: "RULE_BASED", hintLevel: 1, type: "COLOR_HINT", message: "Observa el filtro del haz." });

    expect((await pending).status).toBe("STALE");
    expect(gameProgressService.action).not.toHaveBeenCalled();
  });

  it("guards static fallback against same-tick duplicate clicks", async () => {
    openNeon();
    await screen.findByLabelText("Tablero Neon Flow");
    const hintButton=screen.getByRole("button",{name:"Pista"});
    fireEvent.click(hintButton);
    fireEvent.click(hintButton);

    await waitFor(() => expect(gameProgressService.action).toHaveBeenCalledTimes(1));
    expect(gameProgressService.action).toHaveBeenCalledWith(expect.any(String),expect.objectContaining({type:"HELP",source:"STATIC",sequence:1}));
  });

  it("presents the static help once after its original action is retried", async () => {
    vi.mocked(gameProgressService.action).mockRejectedValueOnce(new Error("Se perdió la respuesta"));
    openNeon();
    await screen.findByLabelText("Tablero Neon Flow");
    fireEvent.click(screen.getByRole("button", { name: "Pista" }));
    await screen.findByText(/No pudimos confirmar la pista/);
    fireEvent.click(screen.getByRole("button", { name: "Reintentar envío" }));
    await screen.findByText(NEON_FLOW_TIPS[0]);
    const calls = vi.mocked(gameProgressService.action).mock.calls;
    expect(calls).toHaveLength(2);
    expect(calls[1]).toEqual(calls[0]);
  });

  it("uses the new revision on the first hint retry after the move queue recovers", async () => {
    const controller = new ValidatedGameSession(officialContext());
    await controller.start();
    vi.mocked(gameProgressService.action).mockRejectedValueOnce(new Error("Sin conexión"))
      .mockRejectedValueOnce(new Error("Sin conexión"));
    controller.action({ type: "PLACE", component: "MIRROR_90", x: 1, y: 1 });
    await waitFor(() => expect(controller.getSnapshot().phase).toBe("error"));
    expect((await controller.requestHint()).status).toBe("PENDING");
    expect(gameProgressService.hint).not.toHaveBeenCalled();
    expect((await controller.requestHint()).status).toBe("DELIVERED");
    expect(gameProgressService.hint).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ revision: 1 }));
  });

  it("discards the hint text if a move is queued while the HELP receipt is being confirmed", async () => {
    const controller = new ValidatedGameSession(officialContext());
    await controller.start();
    let acknowledge!: (value: GameSessionDTO) => void;
    vi.mocked(gameProgressService.action).mockImplementationOnce(() => new Promise(resolve => { acknowledge = resolve; }));
    const hint = controller.requestHint();
    await waitFor(() => expect(gameProgressService.action).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ type: "HELP" })));
    controller.action({ type: "PLACE", component: "MIRROR_90", x: 1, y: 1 });
    acknowledge({ ...controller.getSnapshot().session!, revision: 1 });
    expect((await hint).status).toBe("STALE");
    expect(controller.getSnapshot().session?.revision).toBe(2);
  });

  it.each(["503", "invalid response"])("keeps the pilot protocol for a definitive tutor failure (%s)", async failure => {
    if (failure === "503") vi.mocked(gameProgressService.hint).mockRejectedValueOnce({ response: { status: 503 } });
    else vi.mocked(gameProgressService.hint).mockResolvedValueOnce({ message: "unexpected response" } as Awaited<ReturnType<typeof gameProgressService.hint>>);
    const controller = new ValidatedGameSession(officialContext());
    await controller.start();
    expect(await controller.requestHint()).toEqual({ status: "FALLBACK_ALLOWED", reason: "REJECTED" });
    expect(gameProgressService.action).not.toHaveBeenCalled();
  });

  it.each([
    { board: "Tablero Neon Flow", stage: <NeonFlowStage levels={[NEONFLOW_LEVELS[0]]} activity={officialActivity} />, tips: NEON_FLOW_TIPS },
    { board: "Tablero TetriLogic", stage: <TetriLogicStage levels={[TETRILOGIC_LEVELS[0]]} activity={{ ...officialActivity, idActivity: "act-c002-1", environment: "tetrilogic", levelTemplate: "tetrilogic-v2-1" }} />, tips: TETRILOGIC_TIPS },
  ])("cycles through advice in $board and records each confirmed help", async ({ board, stage, tips }) => {
    render(<MemoryRouter>{stage}</MemoryRouter>);
    await screen.findByLabelText(board);
    const hintButton = screen.getByRole("button", { name: "Pista" });
    for (const [index, tip] of [...tips, tips[0]].entries()) {
      fireEvent.click(hintButton);
      await screen.findByText(tip);
      expect(gameProgressService.action).toHaveBeenLastCalledWith(expect.any(String), { type: "HELP", source: "STATIC", sequence: index + 1 });
    }
    expect(gameProgressService.action).toHaveBeenCalledTimes(tips.length + 1);
    expect(gameProgressService.hint).not.toHaveBeenCalled();
  });

  it("discards a contextual response after the confirmed revision changes", async () => {
    const controller = new ValidatedGameSession(officialContext());
    await controller.start();
    let resolveHint!: (value: Awaited<ReturnType<typeof gameProgressService.hint>>) => void;
    vi.mocked(gameProgressService.hint).mockImplementationOnce(() => new Promise(resolve => { resolveHint = resolve; }));

    const pending = controller.requestHint();
    await waitFor(() => expect(gameProgressService.hint).toHaveBeenCalledTimes(1));
    controller.action({ type: "CHECK" });
    await waitFor(() => expect(gameProgressService.action).toHaveBeenCalledWith(expect.any(String), { type: "CHECK", sequence: 1 }));
    resolveHint({ requestId: vi.mocked(gameProgressService.hint).mock.calls[0][1].requestId, hintId: crypto.randomUUID(), revision: 0, source: "RULE_BASED", hintLevel: 1, type: "COLOR_HINT", message: "Observa el filtro del haz." });

    const result = await pending;

    expect(result.status).toBe("STALE");
    expect(vi.mocked(gameProgressService.action).mock.calls).toHaveLength(1);
  });

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
    solveTetriLevelOne();
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
  it("finishes a pending victory even when the previous board unmounts before the next starts", async () => {
    const first = new ValidatedGameSession(context());
    await first.start();
    let resolve!: (victory: GameVictoryDTO) => void;
    vi.mocked(gameProgressService.complete).mockImplementationOnce(() => new Promise(done => { resolve = done; }));
    first.complete();
    await waitFor(() => expect(gameProgressService.complete).toHaveBeenCalledTimes(1));
    first.dispose();
    const next = new ValidatedGameSession({ ...context(), levelTemplate: "neonflow-v2-2" });
    const pending = next.start();
    await act(async () => {});
    expect(gameProgressService.start).toHaveBeenCalledTimes(1);
    resolve(victoryDTO(first.getSnapshot().session!.sessionId));
    await pending;
    expect(gameProgressService.start).toHaveBeenCalledTimes(2);
  });
  it("retries the previous victory before opening the new board after a failed handoff", async () => {
    const first = new ValidatedGameSession(context());
    await first.start();
    vi.mocked(gameProgressService.complete).mockRejectedValueOnce(new Error("Sin conexión"))
      .mockRejectedValueOnce(new Error("Sin conexión"));
    await first.complete();
    first.dispose();
    const next = new ValidatedGameSession({ ...context(), game: "tetrilogic", levelTemplate: "tetrilogic-v2-1" });
    await next.start();
    expect(next.getSnapshot().phase).toBe("error");
    expect(gameProgressService.start).toHaveBeenCalledTimes(1);
    await next.retry();
    expect(first.getSnapshot().phase).toBe("saved");
    expect(next.getSnapshot().phase).toBe("ready");
    expect(gameProgressService.complete).toHaveBeenCalledTimes(3);
    expect(vi.mocked(gameProgressService.complete).mock.invocationCallOrder[2])
      .toBeLessThan(vi.mocked(gameProgressService.start).mock.invocationCallOrder[1]);
  });

  it("keeps the command for replay when the response has a revision but no board state", async () => {
    const controller = new ValidatedGameSession(context());
    await controller.start();
    vi.mocked(gameProgressService.action).mockResolvedValueOnce({ ...controller.getSnapshot().session!, revision: 1, state: undefined! });
    controller.action({ type: "PLACE", component: "MIRROR_90", x: 1, y: 1 });
    await waitFor(() => expect(controller.getSnapshot().phase).toBe("error"));
    await controller.retry();
    expect(controller.getSnapshot().session?.revision).toBe(1);
    expect(vi.mocked(gameProgressService.action).mock.calls[1]).toEqual(vi.mocked(gameProgressService.action).mock.calls[0]);
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
    expect(useGameStore.getState().status).toBe("SUCCESS");
    fireEvent.click(screen.getByRole("button", { name: "Espejo 90°" }));
    fireEvent.click(screen.getByRole("button", { name: "Celda vacía, fila 1, columna 2" }));
    expect(screen.getByRole("button", { name: /^Rotar espejo, fila 1, columna 2/ })).toBeInTheDocument();
    expect(gameProgressService.action).toHaveBeenCalledTimes(1);
    expect(vi.mocked(gameProgressService.complete).mock.calls).toEqual([[id],[id]]);
  });

  it("retries a victory response that omitted the achievement list", async () => {
    const controller = new ValidatedGameSession(context());
    await controller.start();
    const id = controller.getSnapshot().session!.sessionId;
    vi.mocked(gameProgressService.complete).mockResolvedValueOnce({ ...victoryDTO(id), newAchievements: undefined! });
    expect(await controller.complete()).toBeNull();
    expect(controller.getSnapshot().victory).toBeNull();
    await controller.retry();
    expect(controller.getSnapshot().phase).toBe("saved");
    expect(gameProgressService.complete).toHaveBeenCalledTimes(2);
  });
});
