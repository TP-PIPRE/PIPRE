export interface State {
  x: number;
  y: number;
  angle: number;
  color: string;
  size: number;
  shape: string;
  trail: boolean;
  trailPoints: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    color: string;
  }>;
  stamps: Array<{
    x: number;
    y: number;
    color: string;
    size: number;
    shape: string;
  }>;
  particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
  }>;
  variable: number;
  speech: string | null;
  speechTimer: number;
  running: boolean;
  stopRequested: boolean;
  speed: number;
  showVar: boolean;
}

export interface Block {
  type: string;
  params: Record<string, string>;
}

export interface Simulador {
  state: State;
  blocks: Block[];
}
