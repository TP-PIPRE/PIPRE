export type RotationAngle = 0 | 90 | 180 | 270;

export type Direction = { dx: -1 | 0 | 1; dy: -1 | 0 | 1 };

export type CellType = 'EMPTY' | 'MIRROR_90' | 'FILTER' | 'BLOCK' | 'RECEPTOR';

export interface Cell {
  x: number;
  y: number;
  type: CellType;
  color?: string;
  rotation?: RotationAngle;
}

export interface Grid {
  width: number;
  height: number;
  cells: Cell[];
}

export interface EmitterConfig {
  position: Cell;
  direction: Direction;
  color?: string;
}

export interface OpticalComponent {
  type: 'MIRROR_90' | 'FILTER';
  color?: string;
}

export interface NeonFlowLevelConfig {
  level: number;
  width: number;
  height: number;
  blocked: Cell[];
  receptors: Array<{ position: Cell; color: string }>;
  emitter: EmitterConfig;
}
