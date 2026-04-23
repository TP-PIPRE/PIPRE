
import { SimuladorProvider } from '../../application/context/SimuladorProvider';
import { HardwarePanel } from '../components/Simulador/HardwarePanel';
import { Toolbox } from '../components/Simulador/Toolbox';
import { Workspace } from '../components/Simulador/Workspace';
import { Stage3D } from '../components/Simulador/Stage3D';
import { Console } from '../components/Simulador/Console';
import { MissionsPanel } from '../components/Simulador/MissionsPanel';

export const Simulador = () => {
  return (
    <SimuladorProvider>
      <div className="h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden">
        {/* Main Application Grid */}
        <main className="flex-1 overflow-hidden p-4">
          <div className="h-full w-full max-w-[1920px] mx-auto grid grid-cols-12 grid-rows-[repeat(12,minmax(0,1fr))] gap-4">
            
            {/* Column 1: Hardware & Missions (3 cols) */}
            <div className="col-span-3 row-span-[12] flex flex-col gap-4 min-h-0">
              <div className="h-1/2 min-h-0 panel-border bg-surface">
                <HardwarePanel />
              </div>
              <div className="h-1/2 min-h-0 panel-border bg-surface">
                <MissionsPanel />
              </div>
            </div>

            {/* Column 2: Logic Assembly (5 cols) */}
            <div className="col-span-5 row-span-[12] flex flex-col panel-border min-h-0 bg-surface">
              <div className="flex h-full">
                <div className="w-1/3 border-r border-border">
                  <Toolbox />
                </div>
                <div className="w-2/3">
                  <Workspace />
                </div>
              </div>
            </div>

            {/* Column 3: Visualization & Console (4 cols) */}
            <div className="col-span-4 row-span-[12] flex flex-col gap-4 min-h-0">
              <div className="flex-1 min-h-0 relative panel-border bg-surface-brighter">
                <Stage3D />
              </div>
              <div className="h-48 shrink-0 panel-border bg-surface">
                <Console />
              </div>
            </div>
            
          </div>
        </main>
      </div>
    </SimuladorProvider>
  );
};

export default Simulador;

