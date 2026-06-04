export interface Challenge {
  id: string;
  idCourse: string;
  idModule?: string;
  title: string;
  description: string;
  order: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  points: number;
  isUnlocked: boolean;
  simulatorConfig: any;
  expectedOutput: string;
  reward: {
    type: "BADGE" | "POINTS" | "UNLOCK_NEXT";
    value: string | number;
  };
}
