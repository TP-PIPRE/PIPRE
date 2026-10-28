import type { ActivityResponseDTO } from "../../infrastructure/api/models/apiModels";
import { NEONFLOW_LEVELS, TETRILOGIC_LEVELS } from "../../shared/constants/levelConfigs";

export const LEVEL_TEMPLATES = [
  ...NEONFLOW_LEVELS.map((level) => ({
    id: `neonflow-${level.level}`,
    game: "neonflow" as const,
    label: `Neon Flow · Nivel ${level.level}`,
    config: level,
  })),
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
