import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { getAuthState } from "../../../infrastructure/store/authStore";
import { ValidatedGameSession } from "../../../infrastructure/store/validatedGameSession";
import type { GameAction, GameSessionContext } from "../../../infrastructure/api/models/gameProgressModels";
import { isOfficialGameTemplate } from "../../../infrastructure/api/models/gameProgressModels";

export function useValidatedGameSession(context: Omit<GameSessionContext, "studentId"> | null) {
  const user = getAuthState().user;
  const enabled = user?.role === "student" && context && isOfficialGameTemplate(context.game, context.levelTemplate);
  const key = JSON.stringify(enabled ? { ...context, studentId: user.id } : null);
  const [round, setRound] = useState(0);
  const controller = useMemo(() => {
    void round;
    return key === "null" ? null : new ValidatedGameSession(JSON.parse(key),round>0);
  }, [key, round]);
  useEffect(() => { if (controller) void controller.start(); }, [controller]);
  const state = useSyncExternalStore(controller?.subscribe ?? (() => () => {}), controller?.getSnapshot ?? (() => null));
  return {
    enabled: Boolean(controller), state, ready: !controller || Boolean(state?.session),
    verifying: state?.phase === "verifying",
    action: (action: GameAction) => controller?.action(action),
    complete: controller?.complete ?? (() => {}),
    retry: controller?.retry ?? (() => {}),
    restart: () => setRound(value => value + 1),
    reset: () => { if (state?.victory || state?.phase === "verifying" || state?.phase === "error") setRound(value => value + 1); else controller?.action({ type: "RESET" }); },
  };
}
