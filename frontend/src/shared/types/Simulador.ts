export type BlockCategory = 'event' | 'action' | 'condition' | 'loop' | 'variable';

export type EnvironmentType = 'battle' | 'space' | 'maze' | 'obstacle';

export interface Block {
  id: string;
  type: string;
  category: BlockCategory;
  params: Record<string, string>;
  children?: Block[];
  parentId?: string;
}

export interface ParamOption {
  label: string;
  value: string;
}

export interface BlockDefinition {
  type: string;
  label: string;
  category: BlockCategory;
  hardwareRequired?: string;
  params?: Record<string, string>;
  paramOptions?: Record<string, ParamOption[]>;
  color?: string;
  icon?: string;
  description?: string;
  loopConfig?: LoopConfig;
}

export interface LoopConfig {
  type: 'count' | 'while' | 'forEach';
  defaultIterations?: number;
  maxIterations?: number;
  condition?: string;
}

export interface PortSlotDefinition {
  id: string;
  name: string;
  label: string;
  icon: string;
  accepts: string[];
  category?: "movement" | "sensor" | "weapon" | "power" | "special";
}

export interface HardwarePeripheral {
  id: string;
  name: string;
  type: 'sensor' | 'actuator';
  description: string;
  installed: boolean;
}

export interface HardwareDefinition {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  desc: string;
  blocks: string;
  unlocks: string[];
}

export interface MissionTemplate {
  id: string;
  title: string;
  objective: string;
  maxBlocks: number;
}

export interface EnvironmentConfig {
  id: EnvironmentType;
  name: string;
  description: string;
  icon: string;
  portSlots: PortSlotDefinition[];
  blocks: BlockDefinition[];
  hardware: HardwareDefinition[];
  missions: MissionTemplate[];
  defaultHardware: string[];
  theme?: EnvironmentTheme;
}

export interface EnvironmentTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  particles: string;
}

export interface StudentResult {
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  challengeId: string;
  challengeTitle: string;
  environment: EnvironmentType;
  score: number;
  blocks: number;
  energy: number;
  completedAt: string;
}

export interface State {
  x: number;
  y: number;
  angle: number;
  speed: number;
  running: boolean;
  stopRequested: boolean;
}
