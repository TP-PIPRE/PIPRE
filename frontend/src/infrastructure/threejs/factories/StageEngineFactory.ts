import type { ISimulatorEngine } from "../../ports/ISimulatorEngine";
import type { IStageEngineFactory } from "../../ports/IStageEngineFactory";
import { BattleStageEngine } from "../engines/BattleStageEngine";
import { SpaceStageEngine } from "../engines/SpaceStageEngine";
import { MazeStageEngine } from "../engines/MazeStageEngine";
import { RaceStageEngine } from "../engines/RaceStageEngine";
import { BotStageEngine } from "../BotStageEngine";

const ENGINE_REGISTRY: Record<string, new () => ISimulatorEngine> = {
  battle: BattleStageEngine,
  space: SpaceStageEngine,
  maze: MazeStageEngine,
  obstacle: RaceStageEngine,
};

export class StageEngineFactory implements IStageEngineFactory {
  create(environment: string): ISimulatorEngine {
    const EngineClass = ENGINE_REGISTRY[environment];
    if (EngineClass) {
      return new EngineClass();
    }
    return new BotStageEngine();
  }
}
