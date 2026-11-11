import type { ActivityResponseDTO } from "../../infrastructure/api/models/apiModels";
import { PROGRESSIVE_NEONFLOW_LEVELS, NEONFLOW_LEVELS, LEGACY_NEONFLOW_LEVELS, TETRILOGIC_LEVELS, LEGACY_TETRILOGIC_LEVELS } from "../../shared/constants/levelConfigs";
import type { LevelProgressDTO } from "../../infrastructure/api/models/gameProgressModels";

export const LEVEL_TEMPLATES = [
  ...PROGRESSIVE_NEONFLOW_LEVELS.map(config => ({ id: config.templateId!, game: "neonflow" as const, label: `Neon Flow · ${config.level}. ${config.width} × ${config.height}`, config })),
  ...NEONFLOW_LEVELS.map(config => ({ id: config.templateId!, game: "neonflow" as const, label: `Neon Flow · Nivel ${config.level} (anterior)`, config })),
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

export function challengeAccess(template: ReturnType<typeof resolveActivityLevel>, levels?: LevelProgressDTO[], checking = false) {
  if (!template) return "pending";
  if (template.config.level === 1) return "available";
  if (!levels) return "unconfirmed";
  if (levels.some(level => level.game === template.game && level.levelNumber === template.config.level - 1 && level.completed)) return "available";
  return checking ? "unconfirmed" : "locked";
}

export function activityDescription(activity: ActivityResponseDTO, template: ReturnType<typeof resolveActivityLevel>) {
  if (template?.game !== "tetrilogic") return activity.description ?? "";
  const { cols, rows } = template.config.boardSize;
  return `${cols} × ${rows} · Iguala los objetivos de filas y columnas.`;
}

export function activityDisplayName(activity: ActivityResponseDTO) {
  const previous = activity.environment === "neonflow" && ["neonflow-1", "neonflow-2"].includes(activity.levelTemplate ?? "");
  return activity.name + (previous ? " · Versión anterior" : "");
}

export function compareActivities(a: ActivityResponseDTO, b: ActivityResponseDTO) {
  return (a.displayOrder ?? Number.MAX_SAFE_INTEGER) - (b.displayOrder ?? Number.MAX_SAFE_INTEGER)
    || a.name.localeCompare(b.name, "es", { numeric: true }) || a.idActivity.localeCompare(b.idActivity);
}
