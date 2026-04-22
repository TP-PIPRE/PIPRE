import React from 'react';
import { useSimulador } from '../../../application/context/SimuladorProvider';

export const MissionsPanel = () => {
  const { 
    energy, 
    score, 
    missions, 
    currentMissionIndex, 
    blocks, 
    completeMission 
  } = useSimulador();

  const currentMission = missions[currentMissionIndex];
  const isMissionActive = currentMission && !currentMission.isCompleted;

  return (
    <div className="bg-slate-900 border-r border-slate-700 p-4 flex flex-col gap-6 h-full font-mono text-slate-300">
      
      {/* HEADER */}
      <div className="pb-4 border-b border-slate-700">
        <h2 className="text-xl font-bold tracking-[0.2em] uppercase text-white mb-1">
          Telemetría
        </h2>
        <div className="text-[10px] text-slate-500 uppercase tracking-widest">
          Sistema Central • Sector Alfa
        </div>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-2 gap-4">
        {/* ENERGY */}
        <div className="bg-slate-800 p-3 border border-slate-700">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 flex justify-between">
            <span>Batería</span>
            <span className={energy < 20 ? 'text-red-400 font-bold' : ''}>{Math.round(energy)}%</span>
          </div>
          <div className="h-2 w-full bg-slate-900 border border-slate-700 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${energy > 50 ? 'bg-[#00f5d4]' : energy > 20 ? 'bg-yellow-400' : 'bg-red-500'}`}
              style={{ width: `${energy}%` }}
            />
          </div>
        </div>

        {/* SCORE */}
        <div className="bg-slate-800 p-3 border border-slate-700 flex flex-col justify-center">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
            Puntuación
          </div>
          <div className="text-xl font-bold text-[#fcd34d]">
            {score.toLocaleString('es-ES')}
          </div>
        </div>
      </div>

      {/* CURRENT MISSION */}
      {isMissionActive ? (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#38bdf8] uppercase tracking-widest">
              Misión {currentMissionIndex + 1}
            </h3>
            <span className="text-[10px] bg-[#38bdf8]/10 text-[#38bdf8] px-2 py-1 border border-[#38bdf8]/30">
              ACTIVA
            </span>
          </div>
          
          <div className="bg-slate-800 p-4 border border-slate-700 flex-1">
            <h4 className="font-bold text-white mb-2">{currentMission.title}</h4>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              {currentMission.objective}
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Memoria RAM</span>
                  <span className={`${blocks.length > currentMission.maxBlocks && currentMission.maxBlocks > 0 ? 'text-red-400' : 'text-slate-300'}`}>
                    {blocks.length} / {currentMission.maxBlocks > 0 ? currentMission.maxBlocks : '∞'} Bloques
                  </span>
                </div>
                {currentMission.maxBlocks > 0 && (
                  <div className="h-1 w-full bg-slate-900 overflow-hidden">
                    <div 
                      className={`h-full ${blocks.length <= currentMission.maxBlocks ? 'bg-[#38bdf8]' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(100, (blocks.length / currentMission.maxBlocks) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Debug/Dev button to simulate mission completion */}
          <button 
            onClick={completeMission}
            className="mt-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold tracking-widest uppercase transition-colors"
          >
            [DEV] Completar
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center items-center text-center p-6 border border-dashed border-slate-700">
          <div className="text-4xl mb-4">🏆</div>
          <h3 className="text-lg font-bold text-white mb-2">Sector Completado</h3>
          <p className="text-sm text-slate-500">
            Has superado todas las pruebas de este sector.
          </p>
        </div>
      )}

    </div>
  );
};
