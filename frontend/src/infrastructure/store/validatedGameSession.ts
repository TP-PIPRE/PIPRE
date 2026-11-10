import { gameProgressService } from "../api/gameProgressService";
import { getApiErrorMessage } from "../api/errors";
import type { GameAction, GameHintResponse, GameHintResult, GameSessionContext, GameSessionDTO, GameVictoryDTO } from "../api/models/gameProgressModels";
import { useAchievementStore } from "./achievementStore";

export interface ValidatedSessionState {
  phase: "starting" | "ready" | "verifying" | "saved" | "error";
  session: GameSessionDTO | null; victory: GameVictoryDTO | null; error: string; rejected: boolean; hintBusy: boolean;
}
const activeSessions = new Map<string, ValidatedGameSession>();

/** Ordered commands are retained verbatim until acknowledged; telemetry remains a separate observation. */
export class ValidatedGameSession {
  private readonly clientSessionId = crypto.randomUUID();
  private readonly listeners = new Set<() => void>();
  private snapshot: ValidatedSessionState = { phase: "starting", session: null, victory: null, error: "", rejected: false, hintBusy: false };
  private starting: Promise<void> | null = null;
  private hintWorking: Promise<GameHintResult> | null = null;
  private pendingHint: { requestId: string; revision: number; hint?: GameHintResponse; actionAcknowledged?: boolean; actionRejected?: boolean; rejectionCode?: string } | null = null;
  private working: Promise<GameVictoryDTO | null> | null = null;
  private commands: Array<GameAction & { sequence: number }> = [];
  private nextSequence = 1;
  private closing = false;
  private disposed = false;
  private lifecycle = 0;
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
    if (this.disposed) {
      this.disposed = false;
      this.lifecycle += 1;
    }
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
        if (this.disposed) return;
        const session = (!this.forceNew?await gameProgressService.active(this.context):null) ?? await gameProgressService.start(this.context, this.clientSessionId);
        if (this.disposed) return;
        if (!session?.sessionId || session.game !== this.context.game || session.status !== "ACTIVE") throw new Error("No pudimos preparar el intento. Vuelve a intentarlo.");
        this.nextSequence = session.revision + 1;
        this.update({ session, phase: "ready" });
        if (this.context.dailyChallengeId?.length === 36) window.dispatchEvent(new CustomEvent("pipre:daily-started", { detail: this.context.studentId }));
      } catch (error) { if (!this.disposed) this.update({ phase: "error", error: getApiErrorMessage(error, "No pudimos preparar el intento. Comprueba tu conexión.") }); }
    }).finally(() => { this.starting = null; });
    return this.starting;
  };
  action = (action: GameAction): boolean => {
    if (this.disposed || !this.snapshot.session || this.closing || this.snapshot.victory) return false;
    this.commands.push({ ...action, sequence: this.nextSequence++ });
    if (this.snapshot.phase !== "error") void this.drain();
    return true;
  };
  submitAction = async (action: GameAction): Promise<boolean> => {
    if (this.disposed || !this.snapshot.session || this.closing || this.snapshot.victory) return false;
    const sequence = this.nextSequence++;
    this.commands.push({ ...action, sequence });
    if (this.snapshot.phase !== "error") await this.drain();
    return !this.disposed && !this.commands.some(command => command.sequence === sequence)
      && this.snapshot.session?.revision === sequence;
  };
  complete = (): Promise<GameVictoryDTO | null> => {
    if (this.disposed || !this.snapshot.session || this.snapshot.victory || this.closing) return Promise.resolve(this.snapshot.victory);
    this.closing = true;
    if (this.snapshot.phase !== "error") { this.update({ phase: "verifying" }); return this.drain(); }
    return Promise.resolve(null);
  };
  retry = async (): Promise<GameHintResult | null> => {
    if (this.disposed) return null;
    if (!this.snapshot.session) { await this.start(); return null; }
    this.update({ phase: this.closing ? "verifying" : "ready", error: "" });
    await this.drain();
    return this.takeAcknowledgedHint();
  };
  requestHint = (locale = "es"): Promise<GameHintResult> => {
    if (this.disposed) return Promise.resolve({ status: "STALE" });
    if (this.context.game !== "neonflow" || !this.context.activityId || this.context.dailyChallengeId) {
      return Promise.resolve({ status: "FALLBACK_ALLOWED", reason: "UNAVAILABLE" });
    }
    if (this.hintWorking) return this.hintWorking;
    this.update({ hintBusy: true });
    const lifecycle = this.lifecycle;
    const working = this.requestHintInternal(locale, lifecycle, false).finally(() => {
      this.hintWorking = null;
      this.update({ hintBusy: false });
    });
    this.hintWorking = working;
    return working;
  };
  private async requestHintInternal(locale: string, lifecycle: number, staleRetried: boolean): Promise<GameHintResult> {
    if (!this.isCurrent(lifecycle)) return { status: "STALE" };
    if (this.snapshot.phase === "error") this.update({ phase: "ready", error: "" });
    await this.drain();
    if (!this.isCurrent(lifecycle)) return { status: "STALE" };
    const settledBeforeRequest = this.takeAcknowledgedHint();
    if (settledBeforeRequest) return settledBeforeRequest;
    const session = this.snapshot.session;
    if (!session || this.closing) return { status: "STALE" };
    const request = this.pendingHint ?? { requestId: crypto.randomUUID(), revision: session.revision };
    if (request.revision !== session.revision) {
      this.pendingHint = null;
      return { status: "STALE" };
    }
    this.pendingHint ??= request;
    if (this.commands.length || this.snapshot.phase === "error") return { status: "PENDING", requestId: request.requestId };
    try {
      const hint = this.pendingHint.hint ?? await gameProgressService.hint(session.sessionId, {
        requestId: request.requestId,
        revision: request.revision,
        locale,
      });
      if (!this.isCurrent(lifecycle)) return { status: "STALE" };
      if (hint.requestId !== request.requestId || hint.revision !== request.revision
          || this.snapshot.session?.sessionId !== session.sessionId
          || this.snapshot.session.revision !== request.revision
          || this.commands.length > 0
          || this.nextSequence !== request.revision + 1) {
        this.pendingHint = null;
        return { status: "STALE" };
      }
      this.pendingHint.hint = hint;
      if (!this.commands.some(command => command.hintId === hint.hintId)) {
        const sequence = this.nextSequence++;
        this.pendingHint.actionAcknowledged = false;
        this.commands.push({ type: "HELP", sequence, hintId: hint.hintId });
      }
      await this.drain();
      if (!this.isCurrent(lifecycle)) return { status: "STALE" };
      const settledAfterRequest = this.takeAcknowledgedHint();
      if (settledAfterRequest) return settledAfterRequest;
      if (this.commands.some(command => command.hintId === hint.hintId)) {
        return { status: "PENDING", requestId: request.requestId };
      }
      this.pendingHint = null;
      return { status: "DELIVERED", hint };
    } catch (error) {
      if (!this.isCurrent(lifecycle)) return { status: "STALE" };
      const response = (error as { response?: { status?: number; data?: { code?: string; currentRevision?: number } } }).response;
      if (response?.status === 409 && response.data?.code === "HINT_STALE") {
        if (staleRetried) {
          this.pendingHint = null;
          return { status: "STALE" };
        }
        if (this.commands.length) await this.drain();
        let fresh: GameSessionDTO | null = null;
        try { fresh = await gameProgressService.active(this.context); } catch {
          this.pendingHint = null;
          return { status: "STALE" };
        }
        if (!this.isCurrent(lifecycle)) return { status: "STALE" };
        if (fresh?.sessionId === session.sessionId && fresh.revision === response.data.currentRevision) {
          this.pendingHint = { requestId: crypto.randomUUID(), revision: fresh.revision };
          this.nextSequence = Math.max(this.nextSequence, fresh.revision + 1);
          this.update({ session: fresh, phase: "ready", rejected: false });
          return this.requestHintInternal(locale, lifecycle, true);
        }
        this.pendingHint = null;
        return { status: "STALE" };
      }
      if (response?.status === 409 && response.data?.code === "HINT_PENDING") return { status: "PENDING", requestId: request.requestId };
      if (response?.status && response.status >= 400 && response.status < 500) {
        this.pendingHint = null;
        return { status: "FALLBACK_ALLOWED", reason: "REJECTED" };
      }
      return { status: "PENDING", requestId: request.requestId };
    }
  }
  private isCurrent(lifecycle: number): boolean { return !this.disposed && lifecycle === this.lifecycle; }
  private takeAcknowledgedHint(): GameHintResult | null {
    const completed = this.pendingHint;
    const hint = completed?.hint;
    if (!completed?.actionAcknowledged || !hint) return null;
    this.pendingHint = null;
    if (completed.actionRejected && ["HINT_STALE", "HINT_NOT_FOUND", "HINT_ALREADY_CONSUMED"].includes(completed.rejectionCode ?? "")) return { status: "STALE" };
    if (completed.actionRejected) return { status: "FALLBACK_ALLOWED", reason: "REJECTED" };
    return { status: "DELIVERED", hint };
  }
  dispose = () => {
    this.disposed = true;
    this.lifecycle += 1;
    this.commands = [];
    this.pendingHint = null;
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
          if (this.disposed) return null;
          const command = this.commands[0];
          let session: GameSessionDTO;
          try {
            session = await gameProgressService.action(id, command);
          } catch (error) {
            const status = (error as { response?: { status?: number } }).response?.status;
            if (command.hintId && status === 404) {
              this.commands.shift();
              this.pendingHint = null;
              this.nextSequence = Math.max(this.snapshot.session?.revision ?? 0, ...this.commands.map(item => item.sequence)) + 1;
              this.update({ phase: "ready", error: "", rejected: false });
              continue;
            }
            throw error;
          }
          if (this.disposed) return null;
          if (session?.sessionId !== id || session.revision !== command.sequence) throw new Error("No pudimos sincronizar este movimiento. Reintenta el envío.");
          this.commands.shift();
          if (command.hintId && this.pendingHint?.hint?.hintId === command.hintId) {
            this.pendingHint.actionAcknowledged = true;
            this.pendingHint.actionRejected = Boolean(session.state.lastActionRejected);
            this.pendingHint.rejectionCode = session.state.lastActionRejectionCode;
          }
          this.update({ session, rejected: command.hintId ? false : Boolean(session.state.lastActionRejected) });
        }
        if (this.closing && !this.snapshot.victory) {
          if (this.disposed) return null;
          const victory = await gameProgressService.complete(id);
          if (this.disposed) return null;
          if (victory?.sessionId !== id || ![1, 2, 3].includes(victory.stars)) throw new Error("No pudimos confirmar el resultado. Reintenta el envío.");
          this.update({ phase: "saved", victory, error: "" });
          useAchievementStore.getState().confirmed(this.context.studentId, victory);
          return victory;
        }
        return null;
      } catch (error) { if (!this.disposed) this.update({ phase: "error", error: getApiErrorMessage(error, "El resultado aún no se ha guardado. Comprueba tu conexión y reintenta el envío.") }); return null; }
    }).finally(() => { this.working = null; });
    return this.working;
  }
}
