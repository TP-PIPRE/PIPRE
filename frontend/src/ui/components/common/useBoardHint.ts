import { useRef, useState } from "react";
import type { GameHintResult } from "../../../infrastructure/api/models/gameProgressModels";
import type { useAttemptTrace } from "./useAttemptTrace";
import type { useValidatedGameSession } from "./useValidatedGameSession";
import { useHintVisitBaseline } from "./useHintVisitBaseline";

export function useBoardHint(
  session: ReturnType<typeof useValidatedGameSession>,
  record: ReturnType<typeof useAttemptTrace>["record"],
  tips: readonly [string, ...string[]],
) {
  const [message, setMessage] = useState<string | null>(null);
  const [staticCount, setStaticCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const working = useRef(false);
  const confirmed = session.state?.session;
  const generalSession = confirmed?.state.neonFlowProgressiveTutor || confirmed?.state.progressiveTutor ? undefined : confirmed;
  const total = generalSession?.state.helps;
  const { baseline } = useHintVisitBaseline(generalSession?.sessionId, total);
  const previousHelps = baseline ?? total ?? 0;

  const showStatic = (index: number) => {
    record("HELP", { source: "STATIC" });
    setMessage(tips[index % tips.length]);
  };
  const present = (result: GameHintResult) => {
    switch (result.status) {
      case "STATIC_DELIVERED":
        showStatic(Math.max(0, result.helpCount - previousHelps - 1));
        break;
      case "PENDING":
        setMessage("No pudimos confirmar la pista. Pulsa Pista para reintentar sin duplicarla.");
        break;
      case "STALE":
        setMessage("El tablero cambió mientras se consultaba la pista. Pide una nueva ayuda.");
    }
  };
  const request = async () => {
    if (!session.enabled) {
      showStatic(staticCount);
      setStaticCount(count => count + 1);
      return;
    }
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setMessage(null);
    try {
      present(await session.requestStaticHint());
    } catch {
      setMessage("No pudimos confirmar la pista. Puedes intentarlo nuevamente.");
    } finally {
      working.current = false;
      setBusy(false);
    }
  };
  const retry = async () => {
    if (working.current) return;
    working.current = true;
    try {
      const result = await session.retry();
      if (result) present(result);
    } finally {
      working.current = false;
    }
  };
  return {
    message, request, retry, busy,
    count: total === undefined ? staticCount : Math.max(0, total - previousHelps),
    close: () => setMessage(null),
    reset: () => { setMessage(null); setStaticCount(0); },
  };
}
