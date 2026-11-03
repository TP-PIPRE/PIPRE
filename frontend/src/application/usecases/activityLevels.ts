import type { ActivityResponseDTO } from "../../infrastructure/api/models/apiModels";
import { NEONFLOW_LEVELS, LEGACY_NEONFLOW_LEVELS, TETRILOGIC_LEVELS, LEGACY_TETRILOGIC_LEVELS } from "../../shared/constants/levelConfigs";

export const LEVEL_TEMPLATES = [
  ...NEONFLOW_LEVELS.map(config => ({ id: config.templateId!, game: "neonflow" as const, label: `Neon Flow · ${config.level}. ${config.width} × ${config.height}`, config })),
  ...NEONFLOW_LEVELS.filter(config => config.level >= 3).map(config => ({ id: `neonflow-${config.level}`, game: "neonflow" as const, label: `Neon Flow · Nivel ${config.level} (compatible)`, config })),
  { id: "neonflow-1", game: "neonflow", label: "Neon Flow · Haz directo", config: { ...LEGACY_NEONFLOW_LEVELS[0], templateId: "neonflow-1", version: 1 } },
  { id: "neonflow-2", game: "neonflow", label: "Neon Flow · Esquiva los muros", config: { ...LEGACY_NEONFLOW_LEVELS[1], templateId: "neonflow-2", version: 1 } },
  { id: "tetrilogic-1", game: "tetrilogic", label: "TetriLogic · Prototipo 1 (anterior)", config: LEGACY_TETRILOGIC_LEVELS[0] },
  { id: "tetrilogic-2", game: "tetrilogic", label: "TetriLogic · Prototipo 2 (anterior)", config: LEGACY_TETRILOGIC_LEVELS[1] },
  ...TETRILOGIC_LEVELS.map(config => ({ id: config.templateId!, game: "tetrilogic" as const, label: `TetriLogic · ${config.level}. ${config.title}`, config })),
] as const;

export function resolveActivityLevel(activity: ActivityResponseDTO) {
  return LEVEL_TEMPLATES.find(t => t.id === activity.levelTemplate && t.game === activity.environment);
}

export function activityDisplayName(activity: ActivityResponseDTO) {
  const previous = activity.environment === "neonflow" && ["neonflow-1", "neonflow-2"].includes(activity.levelTemplate ?? "");
  return activity.name + (previous ? " · Versión anterior" : "");
}

export function compareActivities(a: ActivityResponseDTO, b: ActivityResponseDTO) {
  return (a.displayOrder ?? Number.MAX_SAFE_INTEGER) - (b.displayOrder ?? Number.MAX_SAFE_INTEGER)
    || a.name.localeCompare(b.name, "es", { numeric: true }) || a.idActivity.localeCompare(b.idActivity);
}
