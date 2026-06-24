import type { ISimulatorEngine } from "./ISimulatorEngine";

export interface IStageEngineFactory {
  create(environment: string): ISimulatorEngine;
}
