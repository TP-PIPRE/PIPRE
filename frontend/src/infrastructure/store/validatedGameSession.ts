import { gameProgressService } from "../api/gameProgressService";
import { getApiErrorMessage } from "../api/errors";
import type { GameAction, GameSessionContext, GameSessionDTO, GameVictoryDTO } from "../api/models/gameProgressModels";
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
  private working: Promise<void> | null = null;
  private commands: Array<GameAction & { sequence: number }> = [];
  private nextSequence = 1;
  private closing = false;
  private readonly context: GameSessionContext;
  constructor(context: GameSessionContext) { this.context = context; }
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
        if (previous && previous !== this && previous.closing && !previous.snapshot.victory) await previous.drain();
        const session = await gameProgressService.start(this.context, this.clientSessionId);
        if (!session?.sessionId || session.game !== this.context.game || session.status !== "ACTIVE") throw new Error("No pudimos preparar el intento. Vuelve a intentarlo.");
        this.nextSequence = session.revision + 1;
        this.update({ session, phase: "ready" });
      } catch (error) { this.update({ phase: "error", error: getApiErrorMessage(error, "No pudimos preparar el intento. Comprueba tu conexión.") }); }
    }).finally(() => { this.starting = null; });
    return this.starting;
  };
  action = (action: GameAction) => {
    if (!this.snapshot.session || this.closing || this.snapshot.victory) return;
    this.commands.push({ ...action, sequence: this.nextSequence++ });
    if (this.snapshot.phase !== "error") void this.drain();
  };
  complete = () => {
    if (!this.snapshot.session || this.snapshot.victory || this.closing) return;
    this.closing = true;
    if (this.snapshot.phase !== "error") { this.update({ phase: "verifying" }); void this.drain(); }
  };
  retry = () => {
    if (!this.snapshot.session) { void this.start(); return; }
    this.update({ phase: this.closing ? "verifying" : "ready", error: "" });
    void this.drain();
  };
  private drain(): Promise<void> {
    if (this.working) return this.working;
    this.working = Promise.resolve().then(async () => {
      const id = this.snapshot.session?.sessionId;
      if (!id) return;
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
        }
      } catch (error) { this.update({ phase: "error", error: getApiErrorMessage(error, "El resultado aún no se ha guardado. Comprueba tu conexión y reintenta el envío.") }); }
    }).finally(() => { this.working = null; });
    return this.working;
  }
}
