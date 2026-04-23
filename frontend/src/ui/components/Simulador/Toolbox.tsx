import React from 'react';
import { useSimulador } from '../../../application/context/SimuladorProvider';
import type { BlockCategory } from '../../../domain/models/Simulador';

export const Toolbox = () => {
  const { installedHardware } = useSimulador();
  
  const hasRuedas = installedHardware.includes('Tracción Oruga');
  const hasHelices = installedHardware.includes('Hélices Cuádruples');
  const hasGarra = installedHardware.includes('Brazo Robótico');
  const hasSonar = installedHardware.includes('Sensor Ultrasónico');
  const hasLed = installedHardware.includes('Faro LED');

  const onDragStart = (e: React.DragEvent, type: string, category: BlockCategory, params: Record<string, string>) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type, category, params }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const renderBlock = (
    type: string, 
    label: string, 
    category: BlockCategory, 
    isUnlocked: boolean, 
    reqText: string, 
    colorClass: string,
    params: Record<string, string> = {}
  ) => {
    return (
      <div 
        draggable={isUnlocked}
        onDragStart={(e) => onDragStart(e, type, category, params)}
        className={`p-3 border-l-4 ${colorClass} transition-colors relative overflow-hidden ${isUnlocked ? 'bg-slate-800 cursor-grab hover:bg-slate-700' : 'bg-slate-800/30 opacity-50 cursor-not-allowed'}`}
      >
        {!isUnlocked && (
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8cGF0aCBkPSJNMCAwTDggOFoiIHN0cm9rZT0iIzExMSIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg==')] opacity-20 pointer-events-none"></div>
        )}
        <div className="flex items-center justify-between relative z-10">
          <span className="text-slate-200 font-mono text-xs">{label}</span>
          {!isUnlocked && <span className="material-symbols-outlined text-[14px] text-red-400">lock</span>}
        </div>
        {!isUnlocked && <p className="text-[9px] text-red-400/80 font-mono mt-1 relative z-10">Req: {reqText}</p>}
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border-r border-slate-800 flex flex-col h-full">
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 sticky top-0 z-10">
        <h3 className="font-mono text-slate-400 text-xs tracking-[0.2em] uppercase">
          Librería de Bloques
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
        
        {/* Eventos */}
        <div className="space-y-3">
          <h4 className="font-mono text-[#00f5d4] text-[10px] tracking-widest uppercase flex items-center gap-2">
            <div className="w-2 h-2 bg-[#00f5d4] rounded-sm"></div>
            Eventos
          </h4>
          {renderBlock('al_iniciar_sistema', 'AL_INICIAR_SISTEMA', 'event', true, '', 'border-[#00f5d4]')}
          {renderBlock('al_detectar_obstaculo', 'AL_DETECTAR_OBSTACULO', 'event', hasSonar, 'Sensor Ultrasónico', 'border-[#00f5d4]')}
        </div>

        {/* Acciones Terrestres */}
        <div className="space-y-3">
          <h4 className="font-mono text-slate-300 text-[10px] tracking-widest uppercase flex items-center gap-2">
            <div className="w-2 h-2 bg-slate-300 rounded-sm"></div>
            Navegación
          </h4>
          {renderBlock('mover_ruedas', 'MOVER_RUEDAS(30)', 'action', hasRuedas, 'Tracción Oruga', 'border-slate-400', { distancia: '30' })}
          {renderBlock('rotar_nucleo', 'ROTAR_NUCLEO(90)', 'action', hasRuedas, 'Tracción Oruga', 'border-slate-400', { grados: '90' })}
          {renderBlock('elevarse', 'ELEVARSE(50)', 'action', hasHelices, 'Hélices Drone', 'border-sky-400', { altura: '50' })}
          {renderBlock('aterrizar', 'ATERRIZAR()', 'action', hasHelices, 'Hélices Drone', 'border-sky-400')}
        </div>

        {/* Manipulación y Utilidades */}
        <div className="space-y-3">
          <h4 className="font-mono text-amber-400 text-[10px] tracking-widest uppercase flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-400 rounded-sm"></div>
            Interacción
          </h4>
          {renderBlock('agarrar', 'AGARRAR_OBJETO()', 'action', hasGarra, 'Garra Mecánica', 'border-amber-400')}
          {renderBlock('soltar', 'SOLTAR_OBJETO()', 'action', hasGarra, 'Garra Mecánica', 'border-amber-400')}
          {renderBlock('encender_luz', 'ENCENDER_LUZ()', 'action', hasLed, 'Faro LED', 'border-yellow-300')}
        </div>

        {/* Condiciones */}
        <div className="space-y-3">
          <h4 className="font-mono text-[#9b5de5] text-[10px] tracking-widest uppercase flex items-center gap-2">
            <div className="w-2 h-2 bg-[#9b5de5] rounded-sm"></div>
            Condiciones
          </h4>
          {renderBlock('si_distancia', 'SI (distancia < 10)', 'condition', hasSonar, 'Sensor Ultrasónico', 'border-[#9b5de5]')}
        </div>

      </div>
    </div>
  );
};
