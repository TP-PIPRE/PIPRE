import React from 'react';
import { useSimulador } from '../../../application/context/SimuladorProvider';
import type { BlockCategory } from '../../../domain/models/Simulador';

export const Workspace = () => {
  const { blocks, addBlock, removeBlock, clearWorkspace, isRunning, executeProgram, stopExecution } = useSimulador();

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData('application/json');
    if (!dataStr) return;
    try {
      const data = JSON.parse(dataStr);
      addBlock(data.type, data.category, data.params);
    } catch (err) {
      console.error(err);
    }
  };

  const getBorderColor = (category: BlockCategory) => {
    if (category === 'event') return 'border-[#00f5d4]';
    if (category === 'action') return 'border-slate-400';
    if (category === 'condition') return 'border-[#9b5de5]';
    return 'border-slate-600';
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0f19]">
      {/* Header / Toolbar */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
        <h3 className="font-mono text-slate-400 text-xs tracking-[0.2em] uppercase">
          Ensamblaje Lógico
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={isRunning ? stopExecution : executeProgram}
            className={`px-6 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${isRunning ? 'bg-red-500 text-white hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-[#00f5d4] text-slate-900 hover:bg-[#00d1b2] shadow-[0_0_15px_rgba(0,245,212,0.2)]'}`}
          >
            {isRunning ? 'HALT' : 'INIT SECUENCIA'}
          </button>
          <button 
            onClick={clearWorkspace}
            disabled={isRunning}
            className="px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
          >
            PURGAR
          </button>
        </div>
      </div>

      {/* Drop Area */}
      <div 
        className="flex-1 overflow-y-auto p-8 relative"
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}></div>

        {blocks.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 font-mono text-xs uppercase tracking-widest pointer-events-none">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">data_object</span>
            <span>Esperando instrucciones...</span>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col gap-1 items-start">
            {blocks.map(block => (
              <div 
                key={block.id} 
                className={`bg-slate-800/80 backdrop-blur-sm border-l-4 ${getBorderColor(block.category)} p-3 px-4 min-w-[200px] flex justify-between items-center shadow-lg group hover:bg-slate-700 transition-colors`}
              >
                <span className="font-mono text-slate-200 text-sm">{block.type.toUpperCase()}</span>
                <button 
                  onClick={() => removeBlock(block.id)}
                  className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
