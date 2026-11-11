import { useCallback, useEffect, useRef, useState } from "react";
import { gameProgressService } from "../../../infrastructure/api/gameProgressService";
import type { ProgressiveHintProgress, ProgressiveHintRequest } from "../../../infrastructure/api/models/gameProgressModels";
import type { useAttemptTrace } from "./useAttemptTrace";
import { useHintVisitBaseline } from "./useHintVisitBaseline";

const loadError = "No pudimos consultar las ayudas de este reto. Pulsa Pista para reintentar.";
const providerError = "No pudimos preparar el consejo. Puedes volver a intentarlo.";

function readPending(key: string): ProgressiveHintRequest | null {
  try {
    const value: Partial<ProgressiveHintRequest> | null = JSON.parse(sessionStorage.getItem(key) ?? "null");
    if (typeof value?.requestId === "string" && Number.isSafeInteger(value.revision)
        && Number.isSafeInteger(value.ordinal) && typeof value.acceptPenalty === "boolean") return value as ProgressiveHintRequest;
  } catch { /* The server still retains confirmed advice when browser storage is unavailable. */ }
  return null;
}

export function useProgressiveHint(
  sessionId: string | undefined,
  scope: string | undefined,
  prepare: () => Promise<number | null>,
  record: ReturnType<typeof useAttemptTrace>["record"],
) {
  const [progress, setProgress] = useState<ProgressiveHintProgress>();
  const [loading, setLoading] = useState(Boolean(sessionId));
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<number>();
  const pending = useRef<ProgressiveHintRequest | null>(null);
  const inFlight = useRef(false);
  const lifetime = useRef<AbortController | null>(null);
  const storageKey = `pipre.progressive-hint.${sessionId}`;
  const { baseline, rememberBaseline } = useHintVisitBaseline(sessionId ? scope : undefined, progress?.deliveredCount);

  const remember = useCallback((request: ProgressiveHintRequest | null) => {
    pending.current = request;
    try {
      if (request) sessionStorage.setItem(storageKey, JSON.stringify(request));
      else sessionStorage.removeItem(storageKey);
    } catch { /* Keep the request available in memory. */ }
  }, [storageKey]);

  const acceptProgress = useCallback((next: ProgressiveHintProgress, showLast = false) => {
    const request = pending.current;
    const recovered = request && next.deliveredCount >= request.ordinal;
    if (recovered) {
      remember(null);
      if (next.lastHint?.requestId === request.requestId) record("HELP", { source: next.lastHint.source });
    }
    setProgress(next);
    if ((showLast || recovered) && next.lastHint) setMessage(next.lastHint.message);
    return Boolean(recovered);
  }, [record, remember]);

  useEffect(() => {
    if (!sessionId) return;
    const controller = new AbortController();
    lifetime.current = controller;
    pending.current = readPending(storageKey);
    void gameProgressService.progressiveHintProgress(sessionId, controller.signal).then(next => {
      if (!controller.signal.aborted) {
        const initialCount = rememberBaseline(next.deliveredCount);
        acceptProgress(next, next.deliveredCount > initialCount);
      }
    }).catch(() => {
      if (!controller.signal.aborted) setMessage(loadError);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [sessionId, storageKey, acceptProgress, rememberBaseline]);

  const generating = progress?.generating ?? false;
  useEffect(() => {
    if (!sessionId || !generating) return;
    const controller = new AbortController();
    let timer: number;
    const schedule = () => { timer = window.setTimeout(poll, 1200); };
    const poll = async () => {
      try {
        const next = await gameProgressService.progressiveHintProgress(sessionId, controller.signal);
        if (controller.signal.aborted) return;
        const recovered = acceptProgress(next, !pending.current && !next.generating);
        if (!next.generating && !recovered && pending.current) setMessage(providerError);
      } catch { /* The reservation status remains uncertain until a later refresh. */ }
      if (!controller.signal.aborted) schedule();
    };
    schedule();
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [sessionId, generating, acceptProgress]);

  const request = async (confirmedOrdinal?: number) => {
    const signal = lifetime.current?.signal;
    if (!sessionId || !signal || signal.aborted || loading || generating || inFlight.current) return;
    inFlight.current = true;
    setWorking(true);
    setMessage(null);
    setConfirmation(undefined);
    let submitted: ProgressiveHintRequest | undefined;
    try {
      const next = await gameProgressService.progressiveHintProgress(sessionId, signal);
      if (signal.aborted || acceptProgress(next) || next.generating) return;
      const ordinal = next.deliveredCount + 1;
      const revision = await prepare();
      if (signal.aborted) return;
      if (revision === null) {
        setMessage("No pudimos sincronizar el tablero. Pulsa Pista para reintentar.");
        return;
      }
      const stored = pending.current;
      const retry = stored?.ordinal === ordinal && stored.revision === revision ? stored : undefined;
      if (ordinal > 8 && confirmedOrdinal !== ordinal && !retry?.acceptPenalty) {
        setConfirmation(ordinal);
        return;
      }
      submitted = retry ?? { requestId: crypto.randomUUID(), revision, ordinal, acceptPenalty: ordinal > 8 };
      remember(submitted);
      const hint = await gameProgressService.progressiveHint(sessionId, submitted, signal);
      if (signal.aborted) return;
      if (hint?.requestId !== submitted.requestId || hint.ordinal !== ordinal || !hint.message?.trim()
          || hint.source !== (ordinal <= 5 ? "STATIC" : "GENERATIVE")) throw new Error("Incompatible advice receipt");
      acceptProgress({ deliveredCount: hint.ordinal, lastHint: hint, generating: false }, true);
    } catch (error) {
      if (signal.aborted) return;
      if (!submitted) { setMessage(loadError); return; }
      const code = (error as { response?: { data?: { code?: string } } } | null)?.response?.data?.code;
      const next = await gameProgressService.progressiveHintProgress(sessionId, signal).catch(() => null);
      if (signal.aborted || (next && acceptProgress(next))) return;
      if (next?.generating || (!next && code === "HINT_PENDING")) {
        const priorCount = submitted.ordinal - 1;
        if (!next) setProgress(previous => ({ deliveredCount: previous?.deliveredCount ?? priorCount, generating: true }));
        return;
      }
      if (code === "HINT_STALE" || code === "HINT_CONFIRMATION_REQUIRED" || code === "HINT_UNAVAILABLE") remember(null);
      setMessage(code === "HINT_STALE" ? "El tablero cambió. Pulsa Pista para pedir otro consejo." : providerError);
    } finally {
      inFlight.current = false;
      if (!signal.aborted) setWorking(false);
    }
  };

  const close = () => setMessage(null);
  return {
    count: progress ? Math.max(0, progress.deliveredCount - (baseline ?? progress.deliveredCount)) : "—" as const,
    busy: loading || working || generating,
    message, close, reset: close,
    request: () => request(),
    confirmation,
    cancel: () => setConfirmation(undefined),
    confirm: () => request(confirmation),
  };
}
