import { useSimulador } from '../../../application/context/SimuladorProvider';

const HARDWARE_CATALOG = [
  {
    id: 'Tracción Oruga',
    name: 'Tracción Oruga',
    icon: 'settings_motion_mode',
    color: '#00f5d4',
    bgClass: 'bg-[#00f5d4]',
    textClass: 'text-[#00f5d4]',
    borderClass: 'border-[#00f5d4]',
    desc: 'Módulo de movimiento terrestre.',
    blocks: '[MOVER], [ROTAR]'
  },
  {
    id: 'Hélices Cuádruples',
    name: 'Hélices Drone',
    icon: 'flight',
    color: '#38bdf8',
    bgClass: 'bg-sky-400',
    textClass: 'text-sky-400',
    borderClass: 'border-sky-400',
    desc: 'Módulo de propulsión aérea.',
    blocks: '[ELEVARSE], [ATERRIZAR]'
  },
  {
    id: 'Brazo Robótico',
    name: 'Garra Mecánica',
    icon: 'precision_manufacturing',
    color: '#fbbf24',
    bgClass: 'bg-amber-400',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-400',
    desc: 'Módulo de manipulación.',
    blocks: '[AGARRAR], [SOLTAR]'
  },
  {
    id: 'Sensor Ultrasónico',
    name: 'Radar Ultrasónico',
    icon: 'radar',
    color: '#9b5de5',
    bgClass: 'bg-[#9b5de5]',
    textClass: 'text-[#9b5de5]',
    borderClass: 'border-[#9b5de5]',
    desc: 'Sensor de entorno y telemetría.',
    blocks: '[SI_DISTANCIA]'
  },
  {
    id: 'Faro LED',
    name: 'Proyector LED',
    icon: 'highlight',
    color: '#fcd34d',
    bgClass: 'bg-yellow-300',
    textClass: 'text-yellow-300',
    borderClass: 'border-yellow-300',
    desc: 'Módulo emisor de luz.',
    blocks: '[ENCENDER_LUZ]'
  }
];

export const HardwarePanel = () => {
  const { installedHardware, installHardware, uninstallHardware } = useSimulador();

  return (
    <div className="bg-slate-900 border-l border-slate-700 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm z-10 sticky top-0">
        <h3 className="font-mono text-slate-400 text-[10px] tracking-[0.2em] uppercase mb-1">
          Puerto de Ensamblaje
        </h3>
        <p className="text-slate-500 text-xs">
          Instala módulos para habilitar subrutinas lógicas en el sistema.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="grid gap-3">
          {HARDWARE_CATALOG.map((hw) => {
            const isInstalled = installedHardware.includes(hw.id);
            
            return (
              <div 
                key={hw.id}
                className={`p-3 border transition-all duration-300 ${isInstalled ? `${hw.borderClass} bg-slate-800` : 'border-slate-800 bg-slate-900 hover:border-slate-600'} flex items-center justify-between group`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 flex items-center justify-center transition-colors ${isInstalled ? `${hw.bgClass} text-slate-900` : 'bg-slate-800 text-slate-500 group-hover:text-slate-400'} font-mono font-bold text-lg`}>
                    <span className="material-symbols-outlined">{hw.icon}</span>
                  </div>
                  <div>
                    <h4 className={`font-bold text-sm ${isInstalled ? hw.textClass : 'text-slate-300'} transition-colors`}>{hw.name}</h4>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{hw.blocks}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => isInstalled ? uninstallHardware(hw.id) : installHardware(hw.id)}
                  className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors border ${
                    isInstalled 
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/30' 
                    : `bg-transparent text-slate-400 hover:${hw.textClass} border-slate-700 hover:${hw.borderClass}`
                  }`}
                >
                  {isInstalled ? 'Quitar' : 'Instalar'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
