import { useState } from "react";
import type { LevelConfig } from "../../../shared/types/TetriLogic";
import type { ActivityResponseDTO } from "../../../infrastructure/api/models/apiModels";
import { TETRILOGIC_LEVELS } from "../../../shared/constants/levelConfigs";
import { LegacyTetriLogicStage } from "./LegacyTetriLogicStage";
import { OfficialTetriLogicStage } from "./OfficialTetriLogicStage";

/** Retained for compatibility verification of the published catalog; no application route opens it. */
export function HistoricalTetriLogicStage({ levels = TETRILOGIC_LEVELS, activity, onNext }: {
  levels?: LevelConfig[]; activity?: ActivityResponseDTO; onNext?: () => void;
}) {
  const [index, setIndex] = useState(0);
  const level = levels[index];
  if (!level.inventory) return <LegacyTetriLogicStage levels={levels} activity={activity} />;
  return <OfficialTetriLogicStage key={`${activity?.idActivity ?? "practice"}:${level.templateId}`} level={level} activity={activity} index={index} levels={levels} onLevel={setIndex} onNext={onNext} />;
}
