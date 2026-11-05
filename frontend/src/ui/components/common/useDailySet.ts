import { useEffect, useState } from "react";
import { gameProgressService } from "../../../infrastructure/api/gameProgressService";
import { useAchievementStore } from "../../../infrastructure/store/achievementStore";
import type { DailySetDTO } from "../../../infrastructure/api/models/gameProgressModels";

export function useDailySet(studentId: string) {
  const [state, setState] = useState<{ owner?: string; daily?: DailySetDTO; error?: boolean }>({});
  const [retry, setRetry] = useState(0);
  const revision = useAchievementStore(s => s.revisions[studentId] ?? 0);
  useEffect(() => {
    if (!studentId) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let busy = false;
    let expires = 0;
    const refresh = async () => {
      if (busy || controller.signal.aborted) return;
      busy = true;
      if (expires && expires <= Date.now()) setState({ owner: studentId });
      try {
        const daily = await gameProgressService.dailySet(studentId, controller.signal);
        if (!controller.signal.aborted) {
          expires = Date.parse(daily.expiresAt);
          setState(old => old.owner === studentId && JSON.stringify(old.daily) === JSON.stringify(daily) && !old.error ? old : { owner: studentId, daily });
        }
      } catch {
        if (!controller.signal.aborted) setState(old => ({ ...(old.owner === studentId ? old : {}), owner: studentId, error: true }));
      } finally {
        busy = false;
        clearTimeout(timer);
        if (!controller.signal.aborted) timer = setTimeout(() => { void refresh(); }, expires > Date.now() ? Math.min(60000, expires - Date.now() + 50) : 60000);
      }
    };
    const onFocus = () => { void refresh(); };
    const onStarted = (event: Event) => { if ((event as CustomEvent<string>).detail === studentId) void refresh(); };
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    void refresh();
    window.addEventListener("focus", onFocus);
    window.addEventListener("pipre:daily-started", onStarted);
    document.addEventListener("visibilitychange", onVisible);
    return () => { controller.abort(); clearTimeout(timer); window.removeEventListener("focus", onFocus); window.removeEventListener("pipre:daily-started", onStarted); document.removeEventListener("visibilitychange", onVisible); };
  }, [studentId, revision, retry]);
  return { daily: state.owner === studentId ? state.daily : undefined, error: state.owner === studentId && state.error, retry: () => setRetry(n => n + 1) };
}
