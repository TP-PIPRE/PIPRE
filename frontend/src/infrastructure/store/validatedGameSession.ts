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
  private previous?: ValidatedGameSession;
  private hintWorking: Promise<GameHintResult> | null = null;
  private pendingHint: { requestId: string; revision: number; hint?: GameHintResponse; actionAcknowledged?: boolean; actionRejected?: boolean; rejectionCode?: string } | null = null;
  private pendingStaticHint: number | null = null;
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
    // Register synchronously so a third navigation waits for the second, too.
    const current = activeSessions.get(this.context.studentId);
    if (current !== this) {
      this.previous = current;
      activeSessions.set(this.context.studentId, this);
    }
    this.starting = Promise.resolve().then(async () => {
      try {
        if (this.forceNew) await this.previous?.starting;
        else await this.previous?.syncBeforeNavigation();
        if (this.disposed) return;
        const session = (!this.forceNew?await gameProgressService.active(this.context):null) ?? await gameProgressService.start(this.context, this.clientSessionId);
        if (this.disposed) return;
        if (!this.matchesSession(session)) throw new Error("No pudimos preparar el intento. Vuelve a intentarlo.");
        this.previous = undefined;
        this.nextSequence = session.revision + 1;
        this.update({ session, phase: "ready" });
        if (this.context.dailyChallengeId?.length === 36) window.dispatchEvent(new CustomEvent("pipre:daily-started", { detail: this.context.studentId }));
      } catch (error) { if (!this.disposed) this.update({ phase: "error", error: getApiErrorMessage(error, "No pudimos preparar el intento. Comprueba tu conexión.") }); }
    }).finally(() => { this.starting = null; });
    return this.starting;
  };
  private async syncBeforeNavigation() {
    await this.starting;
    await this.previous?.syncBeforeNavigation();
    if (!this.snapshot.session || this.snapshot.victory || (!this.closing && !this.commands.length)) return;
    if (this.snapshot.phase === "error") this.update({ phase: this.closing ? "verifying" : "ready", error: "" });
    await this.drain();
    if (this.snapshot.phase === "error") throw new Error("No pudimos guardar el tablero anterior. Reintenta el envío para continuar.");
  }
  private matchesSession(session: GameSessionDTO | null) {
    const template = this.context.levelTemplate.replace(/^neonflow-(\d+)$/, "neonflow-v2-$1");
    return Boolean(typeof session?.sessionId === "string" && session.sessionId && session.game === this.context.game && session.status === "ACTIVE"
      && (session.levelTemplate === template || session.levelTemplate === this.context.levelTemplate)
      && Number.isSafeInteger(session.revision) && session.revision >= 0 && Array.isArray(session.state?.pieces));
  }
  action = (action: GameAction): boolean => {
    if (this.disposed || !this.snapshot.session || this.closing || this.snapshot.victory) return false;
    this.commands.push({ ...action, sequence: this.nextSequence++ });
    if (this.snapshot.phase !== "error") void this.drain();
    return true;
  };
  requestStaticHint = async (): Promise<GameHintResult> => {
    if (this.disposed || !this.snapshot.session || this.closing || this.snapshot.victory) return { status: "STALE" };
    if (!this.pendingStaticHint) {
      const sequence = this.nextSequence++;
      this.pendingStaticHint = sequence;
      this.commands.push({ type: "HELP", source: "STATIC", sequence });
    }
    if (this.snapshot.phase === "error") this.update({ phase: "ready", error: "" });
    await this.drain();
    if (this.disposed) return { status: "STALE" };
    return this.takeAcknowledgedHint() ?? { status: "PENDING" };
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
    if (!this.context.activityId || this.context.dailyChallengeId) {
      return Promise.resolve({ status: "FALLBACK_ALLOWED", reason: "UNAVAILABLE" });
    }
    if (this.hintWorking) return this.hintWorking;
    this.update({ hintBusy: true });
    const lifecycle = this.lifecycle;
    const working = this.requestHintInternal(locale, lifecycle).finally(() => {
      this.hintWorking = null;
      this.update({ hintBusy: false });
    });
    this.hintWorking = working;
    return working;
  };
  private async requestHintInternal(locale: string, lifecycle: number): Promise<GameHintResult> {
    if (!this.isCurrent(lifecycle)) return { status: "STALE" };
    if (this.snapshot.phase === "error") this.update({ phase: "ready", error: "" });
    await this.drain();
    if (!this.isCurrent(lifecycle)) return { status: "STALE" };
    const settledBeforeRequest = this.takeAcknowledgedHint();
    if (settledBeforeRequest) return settledBeforeRequest;
    const session = this.snapshot.session;
    if (!session || this.closing) return { status: "STALE" };
    if (this.commands.length || this.snapshot.phase === "error") return { status: "PENDING" };
    if (this.pendingHint && this.pendingHint.revision !== session.revision) {
      this.pendingHint = null;
      return { status: "STALE" };
    }
    const request = this.pendingHint ??= { requestId: crypto.randomUUID(), revision: session.revision };
    try {
      const hint = this.pendingHint.hint ?? await gameProgressService.hint(session.sessionId, {
        requestId: request.requestId,
        revision: request.revision,
        locale,
      });
      if (!this.isCurrent(lifecycle)) return { status: "STALE" };
      if (this.closing || this.snapshot.session?.sessionId !== session.sessionId
          || this.snapshot.session.revision !== request.revision
          || this.commands.length > 0
          || this.nextSequence !== request.revision + 1) {
        this.pendingHint = null;
        return { status: "STALE" };
      }
      if (hint?.source !== "RULE_BASED" || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(hint.hintId)
          || ![1, 2, 3].includes(hint.hintLevel) || typeof hint.type !== "string"
          || typeof hint.message !== "string" || !hint.message.trim()) {
        this.pendingHint = null;
        return { status: "FALLBACK_ALLOWED", reason: "REJECTED" };
      }
      if (hint.requestId !== request.requestId || hint.revision !== request.revision) {
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
        return { status: "PENDING" };
      }
      return { status: "STALE" };
    } catch (error) {
      if (!this.isCurrent(lifecycle) || this.closing || this.nextSequence !== request.revision + 1) {
        this.pendingHint = null;
        return { status: "STALE" };
      }
      const response = (error as { response?: { status?: number; data?: { code?: string; currentRevision?: number } } }).response;
      if (response?.status === 409 && response.data?.code === "HINT_STALE") {
        this.pendingHint = null;
        return { status: "STALE" };
      }
      if (response?.status && response.status >= 400) {
        this.pendingHint = null;
        return { status: "FALLBACK_ALLOWED", reason: "REJECTED" };
      }
      return { status: "PENDING" };
    }
  }
  private isCurrent(lifecycle: number): boolean { return !this.disposed && lifecycle === this.lifecycle; }
  private takeAcknowledgedHint(): GameHintResult | null {
    const staticSequence = this.pendingStaticHint;
    const session = this.snapshot.session;
    if (staticSequence !== null && session && session.revision >= staticSequence) {
      this.pendingStaticHint = null;
      return !this.closing && this.nextSequence === staticSequence + 1
        ? { status: "STATIC_DELIVERED", helpCount: session.state.helps } : { status: "STALE" };
    }
    const completed = this.pendingHint;
    const hint = completed?.hint;
    if (!completed?.actionAcknowledged || !hint) return null;
    this.pendingHint = null;
    if (this.closing || this.nextSequence !== hint.revision + 2) return { status: "STALE" };
    if (completed.actionRejected && ["HINT_STALE", "HINT_NOT_FOUND", "HINT_ALREADY_CONSUMED"].includes(completed.rejectionCode ?? "")) return { status: "STALE" };
    if (completed.actionRejected) return { status: "FALLBACK_ALLOWED", reason: "REJECTED" };
    return { status: "DELIVERED", hint };
  }
  dispose = () => {
    this.disposed = true;
    this.lifecycle += 1;
    this.pendingHint = null;
    this.pendingStaticHint = null;
    this.listeners.clear();
    // A new board still waits for the previous board's submitted actions and victory.
  };
  private drain(): Promise<GameVictoryDTO | null> {
    if (this.working) return this.working;
    this.working = Promise.resolve().then(async () => {
      const id = this.snapshot.session?.sessionId;
      if (!id) return null;
      try {
        while (this.commands.length) {
          const command = this.commands[0];
          const session = await gameProgressService.action(id, command);
          if (!this.matchesSession(session) || session.sessionId !== id || session.revision !== command.sequence) throw new Error("No pudimos sincronizar este movimiento. Reintenta el envío.");
          this.commands.shift();
          if (command.hintId && this.pendingHint?.hint?.hintId === command.hintId) {
            this.pendingHint.actionAcknowledged = true;
            this.pendingHint.actionRejected = Boolean(session.state.lastActionRejected);
            this.pendingHint.rejectionCode = session.state.lastActionRejectionCode;
          }
          this.update({ session, rejected: command.hintId ? false : Boolean(session.state.lastActionRejected) });
        }
        if (this.closing && !this.snapshot.victory) {
          const victory = await gameProgressService.complete(id);
          if (victory?.sessionId !== id || ![1, 2, 3].includes(victory.stars) || !Array.isArray(victory.newAchievements))
            throw new Error("No pudimos confirmar el resultado. Reintenta el envío.");
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
