import { gameProgressService } from "../api/gameProgressService";
import { getApiErrorMessage } from "../api/errors";
import type { GameAction, GameHintResponse, GameSessionContext, GameSessionDTO, GameVictoryDTO } from "../api/models/gameProgressModels";
import { useAchievementStore } from "./achievementStore";

export interface ValidatedSessionState {
  phase: "starting" | "ready" | "verifying" | "saved" | "error";
  session: GameSessionDTO | null; victory: GameVictoryDTO | null; error: string; rejected: boolean;
}
const activeSessions = new Map<string, ValidatedGameSession>();

/** Ordered commands are retained verbatim until acknowledged; telemetry remains a separate observation. */
export class ValidatedGameSession {
  private readonly clientSessionId = crypto.randomUUID();
  private readonly listeners = new Set<() => void>();
  private snapshot: ValidatedSessionState = { phase: "starting", session: null, victory: null, error: "", rejected: false };
  private starting: Promise<void> | null = null;
  private hintWorking: Promise<GameHintResponse | null> | null = null;
  private working: Promise<GameVictoryDTO | null> | null = null;
  private commands: Array<GameAction & { sequence: number }> = [];
  private nextSequence = 1;
  private closing = false;
  private disposed = false;
  private readonly context: GameSessionContext;
  private readonly forceNew:boolean;
  constructor(context: GameSessionContext,forceNew=false) { this.context = context;this.forceNew=forceNew; }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private update(patch: Partial<ValidatedSessionState>) {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach(listener => listener());
  }
  start = (): Promise<void> => {
    if (this.starting) return this.starting;
    if (this.snapshot.session) return Promise.resolve();
    this.update({ phase: "starting", error: "" });
    const previous = activeSessions.get(this.context.studentId);
    const previousStart = previous?.starting;
    // Register synchronously so a third navigation waits for the second, too.
    activeSessions.set(this.context.studentId, this);
    this.starting = Promise.resolve().then(async () => {
      try {
        if (previousStart) await previousStart;
        // Starting the next board must not abandon a victory still being saved.
        if (!this.forceNew && previous && previous !== this && !previous.snapshot.victory) {
          await previous.drain();
          if(previous.snapshot.phase==="error")throw new Error("Guarda los movimientos del tablero anterior antes de continuar.");
        }
        const session = (!this.forceNew?await gameProgressService.active(this.context):null) ?? await gameProgressService.start(this.context, this.clientSessionId);
        if (!session?.sessionId || session.game !== this.context.game || session.status !== "ACTIVE") throw new Error("No pudimos preparar el intento. Vuelve a intentarlo.");
        this.nextSequence = session.revision + 1;
        this.update({ session, phase: "ready" });
        if (this.context.dailyChallengeId?.length === 36) window.dispatchEvent(new CustomEvent("pipre:daily-started", { detail: this.context.studentId }));
      } catch (error) { this.update({ phase: "error", error: getApiErrorMessage(error, "No pudimos preparar el intento. Comprueba tu conexión.") }); }
    }).finally(() => { this.starting = null; });
    return this.starting;
  };
  action = (action: GameAction) => {
    if (this.disposed || !this.snapshot.session || this.closing || this.snapshot.victory) return;
    this.commands.push({ ...action, sequence: this.nextSequence++ });
    if (this.snapshot.phase !== "error") void this.drain();
  };
  complete = (): Promise<GameVictoryDTO | null> => {
    if (this.disposed || !this.snapshot.session || this.snapshot.victory || this.closing) return Promise.resolve(this.snapshot.victory);
    this.closing = true;
    if (this.snapshot.phase !== "error") { this.update({ phase: "verifying" }); return this.drain(); }
    return Promise.resolve(null);
  };
  retry = () => {
    if (this.disposed) return;
    if (!this.snapshot.session) { void this.start(); return; }
    this.update({ phase: this.closing ? "verifying" : "ready", error: "" });
    void this.drain();
  };
  requestHint = (locale = "es"): Promise<GameHintResponse | null> => {
    if (this.disposed) return Promise.resolve(null);
    if (this.hintWorking) return this.hintWorking;
    this.hintWorking = (async () => {
      for (let retry = 0; retry < 2; retry += 1) {
        await this.drain();
        const session = this.snapshot.session;
        if (!session || this.closing || this.snapshot.phase === "error") return null;
        const requestId = crypto.randomUUID();
        try {
          const hint = await gameProgressService.hint(session.sessionId, {
            requestId,
            revision: session.revision,
            locale,
          });
          if (this.snapshot.session?.sessionId !== session.sessionId || this.snapshot.session.revision !== session.revision) return null;
          this.commands.push({ type: "HELP", sequence: this.nextSequence++, hintId: hint.hintId });
          await this.drain();
          if (this.snapshot.session?.state.lastActionRejected) return null;
          return hint;
        } catch (error) {
          const response = (error as { response?: { status?: number; data?: { code?: string; currentRevision?: number } } }).response;
          if (retry === 0 && response?.status === 409 && response.data?.code === "HINT_STALE") {
            const fresh = await gameProgressService.active(this.context);
            if (fresh?.sessionId === session.sessionId && fresh.revision === response.data.currentRevision) {
              this.nextSequence = fresh.revision + 1;
              this.update({ session: fresh, phase: "ready", rejected: false });
              continue;
            }
          }
          return null;
        }
      }
      return null;
    })().finally(() => { this.hintWorking = null; });
    return this.hintWorking;
  };
  dispose = () => {
    this.disposed = true;
    this.listeners.clear();
    if (activeSessions.get(this.context.studentId) === this) activeSessions.delete(this.context.studentId);
  };
  private drain(): Promise<GameVictoryDTO | null> {
    if (this.working) return this.working;
    this.working = Promise.resolve().then(async () => {
      const id = this.snapshot.session?.sessionId;
      if (!id) return null;
      try {
        while (this.commands.length) {
          const session = await gameProgressService.action(id, this.commands[0]);
          if (session?.sessionId !== id || session.revision !== this.commands[0].sequence) throw new Error("No pudimos sincronizar este movimiento. Reintenta el envío.");
          this.commands.shift();
          this.update({ session, rejected: Boolean(session.state.lastActionRejected) });
        }
        if (this.closing && !this.snapshot.victory) {
          const victory = await gameProgressService.complete(id);
          if (victory?.sessionId !== id || ![1, 2, 3].includes(victory.stars)) throw new Error("No pudimos confirmar el resultado. Reintenta el envío.");
          this.update({ phase: "saved", victory, error: "" });
          useAchievementStore.getState().confirmed(this.context.studentId, victory);
          return victory;
        }
        return null;
      } catch (error) { this.update({ phase: "error", error: getApiErrorMessage(error, "El resultado aún no se ha guardado. Comprueba tu conexión y reintenta el envío.") }); return null; }
    }).finally(() => { this.working = null; });
    return this.working;
  }
}
