import { useEffect, useRef } from 'react';
import { useSimulador } from '../../../application/context/SimuladorProvider';
import { BotStageEngine } from '../../../infrastructure/threejs/BotStageEngine';

export const Stage3D = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { engineRef, isRunning, installedHardware } = useSimulador();

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const engine = new BotStageEngine();
    engine.init(canvasRef.current);
    engine.updateHardware(installedHardware);
    engineRef.current = engine;

    const handleResize = () => {
      if (canvasRef.current) {
        engine.resize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.dispose();
      engineRef.current = null;
    };
  }, []); // Run only once on mount

  // Sync hardware
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateHardware(installedHardware);
    }
  }, [installedHardware]);

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden border border-slate-700">
      {/* Reticle / HUD */}
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <div className="font-mono text-[10px] text-slate-500 uppercase tracking-[0.2em]">
              Visión Orto 2.5D
            </div>
            <div className="font-mono text-[9px] text-slate-600 uppercase tracking-widest flex gap-3">
              <span>[DRAG] PAN</span>
              <span>[SCROLL] ZOOM</span>
            </div>
          </div>
          <div className={`font-mono text-[10px] uppercase tracking-[0.2em] px-2 py-1 border ${isRunning ? 'border-[#00f5d4] text-[#00f5d4] shadow-[0_0_10px_rgba(0,245,212,0.2)]' : 'border-slate-700 text-slate-500'}`}>
            {isRunning ? 'Ejecutando' : 'Standby'}
          </div>
        </div>
        <div className="flex justify-center items-center h-full opacity-10">
          <div className="w-64 h-64 border border-dashed border-slate-400 rounded-full flex items-center justify-center">
            <div className="w-1 h-1 bg-slate-400"></div>
          </div>
        </div>
      </div>

      <canvas 
        ref={canvasRef} 
        className="w-full h-full block"
      />
    </div>
  );
};
