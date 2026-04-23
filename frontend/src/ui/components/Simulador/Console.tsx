import { useEffect, useRef } from 'react';
import { useSimulador } from '../../../application/context/SimuladorProvider';

export const Console = () => {
  const { logs } = useSimulador();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getColor = (type: string) => {
    switch(type) {
      case 'error': return 'text-red-400';
      case 'success': return 'text-[#00f5d4]';
      case 'warn': return 'text-yellow-400';
      default: return 'text-slate-300';
    }
  };

  return (
    <div className="bg-[#0b0f19] border border-slate-800 flex flex-col h-full font-mono text-xs">
      <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <span className="text-slate-500 uppercase tracking-widest text-[10px] font-bold">Terminal de Datos</span>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 bg-slate-700"></div>
          <div className="w-2 h-2 bg-slate-700"></div>
          <div className="w-2 h-2 bg-slate-700"></div>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-1.5">
        {logs.length === 0 ? (
          <div className="text-slate-600 opacity-50">Esperando eventos de sistema...</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-slate-600 shrink-0">{log.time}</span>
              <span className={`${getColor(log.type)}`}>{log.msg}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
