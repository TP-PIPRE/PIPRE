import catalog from './neonFlowCatalog.json';
import progressiveCatalog from './neonFlowProgressiveCatalog.json';
import type { NeonFlowLevelConfig } from '../types/NeonFlow';
export const NEONFLOW_LEVELS = catalog as NeonFlowLevelConfig[];
export const PROGRESSIVE_NEONFLOW_LEVELS = progressiveCatalog as NeonFlowLevelConfig[];
