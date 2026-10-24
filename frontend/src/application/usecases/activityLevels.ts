import type { ActivityResponseDTO } from "../../infrastructure/api/models/apiModels";
import { NEONFLOW_LEVELS, TETRILOGIC_LEVELS } from "../../shared/constants/levelConfigs";

export const LEVEL_TEMPLATES = [
  { id: "neonflow-1", game: "neonflow", label: "Neon Flow · Haz directo", config: NEONFLOW_LEVELS[0] },
  { id: "neonflow-2", game: "neonflow", label: "Neon Flow · Esquiva los muros", config: NEONFLOW_LEVELS[1] },
  { id: "tetrilogic-1", game: "tetrilogic", label: "TetriLogic · Tablero 4 × 4", config: TETRILOGIC_LEVELS[0] },
  { id: "tetrilogic-2", game: "tetrilogic", label: "TetriLogic · Fila bloqueada", config: TETRILOGIC_LEVELS[1] },
] as const;

export function resolveActivityLevel(activity: ActivityResponseDTO) {
  return LEVEL_TEMPLATES.find(t => t.id === activity.levelTemplate && t.game === activity.environment);
}

export function compareActivities(a: ActivityResponseDTO, b: ActivityResponseDTO) {
  return (a.displayOrder ?? Number.MAX_SAFE_INTEGER) - (b.displayOrder ?? Number.MAX_SAFE_INTEGER)
    || a.name.localeCompare(b.name, "es", { numeric: true }) || a.idActivity.localeCompare(b.idActivity);
}
