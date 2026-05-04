export interface ISimulatorEngine {
  init(canvas: HTMLCanvasElement): void;
  dispose(): void;
  resize(width: number, height: number): void;

  // Acciones
  moveForward(distance: number, duration: number): Promise<void>;
  rotateCore(degrees: number, duration: number): Promise<void>;

  // Sensores
  triggerUltrasonicSensor(duration: number): Promise<number>;

  // Hardware
  updateHardware(installedHardware: string[]): void;

  // Tema
  updateTheme(themeColors: Record<string, string>): void; // <-- AGREGA ESTA LÍNEA

  // Control
  stop(): void;
  reset(): void;
}
