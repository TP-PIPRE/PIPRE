export interface ISimulatorEngine {
  init(canvas: HTMLCanvasElement): void;
  dispose(): void;
  resize(width: number, height: number): void;
  
  // Acciones
  moveForward(distance: number, duration: number): Promise<void>;
  rotateCore(degrees: number, duration: number): Promise<void>;
  
  // Sensores
  triggerUltrasonicSensor(duration: number): Promise<number>; // Retorna distancia detectada
  
  // Hardware
  updateHardware(installedHardware: string[]): void;

  // Control
  stop(): void;
  reset(): void;
}
