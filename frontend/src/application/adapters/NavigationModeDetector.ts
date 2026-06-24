import type { ChallengeData } from "../usecases/SimuladorUseCase";
import type { ActivityResponse } from "../../shared/types/SpecContracts";
import type { EnvironmentType } from "../../shared/types/Simulador";

export type NavigationMode = "playground" | "challenge";

export interface NavigationContext {
  mode: NavigationMode;
  hasActivity: boolean;
  hasChallenge: boolean;
  environment: EnvironmentType;
  challengeId: string | null;
  activityId: string | null;
}

export class NavigationModeDetector {
  static detect(
    challengeData: ChallengeData | null,
    selectedActivity: ActivityResponse | null,
    environment: EnvironmentType
  ): NavigationContext {
    const hasChallenge = challengeData !== null;
    const hasActivity = selectedActivity !== null;

    let mode: NavigationMode;
    if (hasChallenge) {
      mode = "challenge";
    } else if (hasActivity) {
      mode = "challenge";
    } else {
      mode = "playground";
    }

    return {
      mode,
      hasActivity,
      hasChallenge,
      environment,
      challengeId: challengeData?.id || null,
      activityId: selectedActivity?.idActivity || null,
    };
  }

  static isPlaygroundMode(context: NavigationContext): boolean {
    return context.mode === "playground";
  }

  static isChallengeMode(context: NavigationContext): boolean {
    return context.mode === "challenge";
  }

  static shouldShowFullUI(context: NavigationContext): boolean {
    return context.mode === "playground";
  }

  static shouldShowChallengeUI(context: NavigationContext): boolean {
    return context.mode === "challenge";
  }

  static getVisiblePanels(context: NavigationContext): {
    showHardware: boolean;
    showToolbox: boolean;
    showMissions: boolean;
    showCanvas: boolean;
    showEnvironmentSelector: boolean;
    showChallengeInfo: boolean;
  } {
    if (context.mode === "playground") {
      return {
        showHardware: true,
        showToolbox: true,
        showMissions: true,
        showCanvas: true,
        showEnvironmentSelector: true,
        showChallengeInfo: false,
      };
    }

    return {
      showHardware: true,
      showToolbox: true,
      showMissions: true,
      showCanvas: true,
      showEnvironmentSelector: false,
      showChallengeInfo: true,
    };
  }

  static getFilteredBlocks(
    context: NavigationContext,
    allBlocks: Array<{ type: string; category: string; hardwareRequired?: string }>
  ): Array<{ type: string; category: string; hardwareRequired?: string }> {
    if (context.mode === "playground") {
      return allBlocks;
    }

    return allBlocks.filter((block) => {
      if (!block.hardwareRequired) return true;
      return true;
    });
  }

  static getLayoutConfig(context: NavigationContext): {
    leftPanelWidth: number;
    rightPanelWidth: number;
    showBottomPanel: boolean;
    centerPanelRatio: number;
  } {
    if (context.mode === "playground") {
      return {
        leftPanelWidth: 280,
        rightPanelWidth: 260,
        showBottomPanel: true,
        centerPanelRatio: 0.6,
      };
    }

    return {
      leftPanelWidth: 240,
      rightPanelWidth: 280,
      showBottomPanel: true,
      centerPanelRatio: 0.5,
    };
  }
}
