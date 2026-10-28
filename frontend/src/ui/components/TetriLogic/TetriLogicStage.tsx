import { useState } from "react";
import type { LevelConfig } from "../../../shared/types/TetriLogic";
import type { ActivityResponseDTO } from "../../../infrastructure/api/models/apiModels";
import { TETRILOGIC_LEVELS } from "../../../shared/constants/levelConfigs";
import { FreeTetriLogicStage } from "./FreeTetriLogicStage";
export function TetriLogicStage({levels=TETRILOGIC_LEVELS,activity}: {levels?:LevelConfig[];activity?:ActivityResponseDTO}) {
  const [index,setIndex] = useState(0);
  const level = levels[index];
  if (!level) return <p role="status">No hay un tablero disponible.</p>;
  return <FreeTetriLogicStage key={`${activity?.idActivity ?? "practice"}:${level.templateId ?? level.level}`} level={level} levels={levels} index={index} onLevel={setIndex} activity={activity} />;
}
