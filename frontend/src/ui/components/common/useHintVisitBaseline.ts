import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useLocation } from "react-router-dom";
import { getHintBaseline, rememberHintBaseline, subscribeToHintVisit } from "../../../infrastructure/store/hintVisit";

export function useHintVisitBaseline(scope: string | undefined, total: number | undefined) {
  const { pathname, search } = useLocation();
  const route = pathname + search;
  const baseline = useSyncExternalStore(subscribeToHintVisit, () => scope ? getHintBaseline(route, scope) : undefined);
  const rememberBaseline = useCallback((count: number) => scope ? rememberHintBaseline(route, scope, count) : count, [route, scope]);

  useEffect(() => {
    if (scope && total !== undefined && baseline === undefined) rememberBaseline(total);
  }, [scope, total, baseline, rememberBaseline]);

  return { baseline, rememberBaseline };
}
