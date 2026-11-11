const storageKey = "pipre.hint-visit";

type HintVisit = { route: string; scope?: string; baseline?: number };
let currentVisit: HintVisit | undefined;

function readVisit(): HintVisit | undefined {
  if (currentVisit) return currentVisit;
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? "null") as HintVisit | null;
    if (typeof saved?.route === "string") currentVisit = saved;
  } catch { /* The visit still works in memory when storage is unavailable. */ }
  return currentVisit;
}

function saveVisit(visit: HintVisit) {
  currentVisit = visit;
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(visit));
  } catch { /* Keep tracking the visit in memory. */ }
}

export function updateHintVisitRoute(route: string) {
  if (readVisit()?.route !== route) saveVisit({ route });
}

export function rememberHintBaseline(route: string, scope: string, total: number) {
  const visit = readVisit();
  if (visit?.route === route && visit.scope === scope && typeof visit.baseline === "number") return visit.baseline;
  saveVisit({ route, scope, baseline: total });
  return total;
}
