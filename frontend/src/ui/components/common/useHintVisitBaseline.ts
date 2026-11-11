import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { rememberHintBaseline } from "../../../infrastructure/store/hintVisit";

export function useHintVisitBaseline(scope: string | undefined, total: number | undefined) {
  const { pathname, search } = useLocation();
  const route = pathname + search;
  const [visit, setVisit] = useState<{ route: string; scope: string; baseline: number }>();
  const baseline = visit?.route === route && visit.scope === scope ? visit.baseline : undefined;
  const rememberBaseline = useCallback((count: number) => {
    if (!scope) return count;
    const baseline = rememberHintBaseline(route, scope, count);
    setVisit({ route, scope, baseline });
    return baseline;
  }, [route, scope]);

  useEffect(() => {
    if (scope && total !== undefined && baseline === undefined) rememberBaseline(total);
  }, [scope, total, baseline, rememberBaseline]);

  return { baseline, rememberBaseline };
}
