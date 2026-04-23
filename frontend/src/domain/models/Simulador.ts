export type BlockCategory = 'event' | 'action' | 'condition';

export interface Block {
  id: string;
  type: string;
  category: BlockCategory;
  params: Record<string, string>;
}

export interface HardwarePeripheral {
  id: string;
  name: string;
  type: 'sensor' | 'actuator';
  description: string;
  installed: boolean;
}

export interface State {
  x: number;
  y: number;
  angle: number;
  speed: number;
  running: boolean;
  stopRequested: boolean;
}
