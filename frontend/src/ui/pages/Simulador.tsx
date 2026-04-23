
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
      <div className="bg-[#050505] min-h-screen text-slate-300 font-sans selection:bg-[#00f5d4] selection:text-[#050505] overflow-hidden flex flex-col pt-16">
        
        {/* Header Ribbon */}
        <header className="border-b border-slate-800 px-6 py-3 flex justify-between items-center bg-[#0a0a0a] z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-[#00f5d4] flex items-center justify-center font-bold text-[#050505] font-mono text-xl leading-none">
              P
            </div>
            <h1 className="font-mono uppercase tracking-[0.3em] text-sm font-bold text-slate-200">
              PIPRE // <span className="text-slate-500">Core_Sim</span>
            </h1>
          </div>
          <div className="font-mono text-xs text-slate-500 uppercase tracking-widest flex items-center gap-4">
            <span>Status: <span className="text-[#00f5d4]">Online</span></span>
            <span className="w-px h-4 bg-slate-700 block"></span>
            <span>v2.5.0</span>
          </div>
        </header>

        {/* Main Application Grid */}
        <main className="flex-1 overflow-hidden p-4">
          <div className="h-full w-full max-w-[1920px] mx-auto grid grid-cols-12 grid-rows-12 gap-4">
            
            {/* Column 1: Hardware & Missions (3 cols) */}
            <div className="col-span-3 row-span-12 flex flex-col gap-4 min-h-0">
              <div className="h-1/2 min-h-0 border border-slate-800">
                <HardwarePanel />
              </div>
              <div className="h-1/2 min-h-0 border border-slate-800">
                <MissionsPanel />
              </div>
            </div>

            {/* Column 2: Logic Assembly (5 cols) */}
            <div className="col-span-5 row-span-12 flex flex-col border border-slate-800 min-h-0 bg-slate-900">
              {/* Inside we can have Toolbox and Workspace horizontally or just keep Workspace and put Toolbox inside or beside */}
              <div className="flex h-full">
                <div className="w-1/3 border-r border-slate-800">
                  <Toolbox />
                </div>
                <div className="w-2/3">
                  <Workspace />
                </div>
              </div>
            </div>

            {/* Column 3: Visualization & Console (4 cols) */}
            <div className="col-span-4 row-span-12 flex flex-col gap-4 min-h-0">
              <div className="flex-1 min-h-0 relative border border-slate-800 bg-[#0b0f19]">
                <Stage3D />
              </div>
              <div className="h-48 shrink-0">
                <Console />
              </div>
            </div>
            
          </div>
        </main>
        
        <style dangerouslySetInnerHTML={{ __html: `
          .material-symbols-outlined {
            font-variation-settings:
              "FILL" 0,
              "wght" 400,
              "GRAD" 0,
              "opsz" 24;
          }
          
          /* Custom scrollbar for an industrial feel */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #0a0a0a;
            border-left: 1px solid #1e293b;
          }
          ::-webkit-scrollbar-thumb {
            background: #334155;
            border-radius: 0;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #475569;
          }
        `}} />
      </div>
    </SimuladorProvider>
  );
};

export default Simulador;
