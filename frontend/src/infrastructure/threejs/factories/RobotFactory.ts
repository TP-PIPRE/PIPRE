import type { IRobotBuilder } from "../../ports/IRobotBuilder";
import { BotBuilder } from "../shared/BotBuilder";
import { MazeBotBuilder } from "../shared/MazeBotBuilder";
import { BattleBotBuilder } from "../shared/BattleBotBuilder";
import { RaceBotBuilder } from "../shared/RaceBotBuilder";
import { SpaceBotBuilder } from "../shared/SpaceBotBuilder";
import { robotComponentFactory, type RobotComponent } from "./RobotComponentFactory";

interface RobotParts {
  group: THREE.Group;
  core: THREE.Mesh;
  parts: Record<string, THREE.Object3D>;
}

const BUILDER_REGISTRY: Record<string, new () => IRobotBuilder> = {
  battle: BattleBotBuilder,
  maze: MazeBotBuilder,
  obstacle: RaceBotBuilder,
  space: SpaceBotBuilder,
};

export class RobotFactory {
  private static componentCache: Map<string, RobotComponent> = new Map();

  static create(environment: string): IRobotBuilder {
    const BuilderClass = BUILDER_REGISTRY[environment];
    if (BuilderClass) {
      return new BuilderClass();
    }
    return new BotBuilder();
  }

  static createComponent(componentId: string): RobotComponent {
    const cached = this.componentCache.get(componentId);
    if (cached) {
      return cached;
    }

    const component = robotComponentFactory.create(componentId);
    this.componentCache.set(componentId, component);
    return component;
  }

  static createComponents(componentIds: string[]): RobotComponent[] {
    return componentIds.map((id) => this.createComponent(id));
  }

  static getAvailableComponents(): string[] {
    return robotComponentFactory.getAvailable();
  }

  static clearCache(): void {
    this.componentCache.clear();
  }
}

import * as THREE from "three";
