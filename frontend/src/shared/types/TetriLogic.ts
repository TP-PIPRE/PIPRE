export type TetriminoType = 'O' | 'I' | 'T' | 'S' | 'Z' | 'L' | 'J';

export interface Cell {
  x: number;
  y: number;
}

export interface BoardCell {
  position: Cell;
  blocked: boolean;
  tetriminoType: TetriminoType | null;
}

export interface BoardSize {
  rows: number;
  cols: number;
}

export interface Board {
  size: BoardSize;
  cells: BoardCell[][];
  blockedCells: Cell[];
}

export type RotationAngle = 0 | 90 | 180 | 270;

export interface Tetrimino {
  id: string;
  type: TetriminoType;
  shape: Cell[];
  rotation: RotationAngle;
}

export interface LineCountConstraint {
  line: number;
  orientation: 'row' | 'column';
  targetCount: number;
}

export interface Piece extends Tetrimino {
  position: Cell;
}

export interface LevelConfig {
  level: number;
  boardSize: BoardSize;
  blockedCells: Cell[];
  constraints: LineCountConstraint[];
}
