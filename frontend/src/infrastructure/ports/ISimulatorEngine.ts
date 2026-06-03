export interface ISimulatorEngine {
  init(canvas: HTMLCanvasElement): void;
  dispose(): void;
  resize(width: number, height: number): void;

  // Acciones base
  moveForward(distance: number, duration: number): Promise<void>;
  rotateCore(degrees: number, duration: number): Promise<void>;

  // Sensores
  triggerUltrasonicSensor(duration: number): Promise<number>;

  // Hardware
  updateHardware(installedHardware: string[]): void;

  // Tema
  updateTheme(themeColors: Record<string, string>): void;

  // Partículas y feedback visual
  triggerParticles(
    x: number,
    z: number,
    type: "move" | "success" | "collision" | "scan" | "attack" | "magic",
  ): void;

  // Control
  stop(): void;
  reset(): void;
}
