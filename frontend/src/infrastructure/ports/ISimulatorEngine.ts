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

  // Ghost preview (for workspace hover feedback)
  getBotPosition?(): { x: number; z: number; rotation: number };
  showPathPreview?(waypoints: Array<{ x: number; z: number; y?: number }>): void;
  showRotationPreview?(angle: number): void;
  showMarkerPreview?(x: number, z: number, color?: string): void;
  clearPreview?(): void;
  showCounter?(value: number): void;

  // Acciones específicas por entorno (opcionales)
  attack?(power: number, duration: number): Promise<void>;
  activateShield?(duration: number): Promise<void>;
  scan?(duration: number): Promise<number>;
  strike?(duration: number): Promise<void>;
  takeOff?(altitude: number, duration: number): Promise<void>;
  land?(duration: number): Promise<void>;
  collect?(duration: number): Promise<void>;
  analyze?(duration: number): Promise<string>;
  drill?(duration: number): Promise<void>;
  lightUp?(duration: number): Promise<void>;
  openDoor?(duration: number): Promise<boolean>;
  detectMagic?(duration: number): Promise<string>;
  teleport?(duration: number): Promise<void>;
  freeze?(duration: number): Promise<void>;
  boost?(speed: number, duration: number): Promise<void>;
  brake?(duration: number): Promise<void>;
  jump?(duration: number): Promise<void>;
  dodge?(duration: number): Promise<void>;
  emergencyBrake?(duration: number): Promise<void>;
  getState?(): Record<string, unknown>;
}
