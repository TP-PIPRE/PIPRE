import { useEffect, useRef } from 'react';
import { useSimulador } from '../../../application/context/SimuladorProvider';
import { BotStageEngine } from '../../../infrastructure/threejs/BotStageEngine';

export const Stage3D = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { engineRef, isRunning, installedHardware, currentTheme } = useSimulador();

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const engine = new BotStageEngine();
    engine.init(canvasRef.current);
    engine.updateHardware(installedHardware);
    if (currentTheme?.colors) {
      engine.updateTheme(currentTheme.colors);
    }
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

  // Sync theme
  useEffect(() => {
    if (engineRef.current && currentTheme?.colors) {
      engineRef.current.updateTheme(currentTheme.colors);
    }
  }, [currentTheme]);

  return (
    <div className="relative w-full h-full bg-bg overflow-hidden border border-border panel-border">
      {/* Reticle / HUD */}
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1 animate-fade-in">
            <div className="font-mono text-[10px] text-primary uppercase tracking-[0.3em] font-bold">
              Visión Orto 2.5D // Activa
            </div>
            <div className="font-mono text-[9px] text-text-muted uppercase tracking-widest flex gap-4 opacity-70">
              <span>[DRAG] PAN</span>
              <span>[SCROLL] ZOOM</span>
            </div>
          </div>
          <div className={`font-mono text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 border-2 transition-all duration-500 ${isRunning ? 'border-success text-success shadow-[0_0_15px_var(--theme-success)]' : 'border-border text-text-muted'}`}>
            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${isRunning ? 'bg-success animate-pulse' : 'bg-text-muted'}`}></span>
            {isRunning ? 'Ejecutando' : 'Standby'}
          </div>
        </div>

        {/* Bottom Telemetry */}
        <div className="flex justify-between items-end animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="font-mono text-[9px] text-text-muted/50 max-w-[200px]">
             {'SYS_READY >> LATENCY: 24ms'}<br/>
             POSITION_SYNC: 100%
          </div>
          <div className="w-32 h-1 bg-primary-low border border-border">
            <div className="h-full bg-primary" style={{ width: isRunning ? '100%' : '30%', transition: 'width 2s ease' }}></div>
          </div>
        </div>

        {/* Center Reticle */}
        <div className="absolute inset-0 flex justify-center items-center opacity-10 pointer-events-none">
          <div className="w-80 h-80 border border-border rounded-full flex items-center justify-center">
            <div className="w-64 h-64 border border-dashed border-border rounded-full flex items-center justify-center animate-[spin_60s_linear_infinite]">
              <div className="w-1 h-32 border-l border-primary absolute top-0"></div>
            </div>
            <div className="w-2 h-2 bg-primary rounded-full"></div>
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
