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
    <div 
      className="bg-surface border-r border-border p-6 flex flex-col gap-8 h-full animate-fade-in overflow-y-scroll"
      style={{ borderRight: '1px solid var(--border)' }}
    >

      {/* HEADER */}
      <div className="pb-6 border-b border-border">
        <h2 className="text-xl font-bold tracking-tight text-text mb-1 hover:translate-x-1 transition-transform cursor-default">
          Panel de Misiones
        </h2>
        <div className="text-[10px] text-primary uppercase tracking-[0.3em] font-bold">
          Nodo de Control • Alfa-7
        </div>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-2 gap-4">
        {/* ENERGY */}
        <div 
          className="p-4 bg-bg border border-border group hover:border-primary/40 transition-all duration-300"
          style={{ borderRadius: "var(--theme-radius)" }}
        >
          <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-3 flex justify-between">
            <span>Energía</span>
            <span 
              className={energy < 20 ? 'animate-pulse text-danger font-black' : 'text-primary'}
            >
              {Math.round(energy)}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-surface-brighter rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-1000 shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]"
              style={{
                width: `${energy}%`,
                backgroundColor: energy > 50 ? 'var(--primary)' : energy > 20 ? 'var(--accent)' : 'var(--danger)'
              }}
            />
          </div>
        </div>

        {/* SCORE */}
        <div 
          className="p-4 bg-bg border border-border flex flex-col justify-center hover:border-primary/40 transition-all duration-300"
          style={{ borderRadius: "var(--theme-radius)" }}
        >
          <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1">
            Puntuación
          </div>
          <div className="text-2xl font-black text-primary glow-text">
            {score.toLocaleString('es-ES')}
          </div>
        </div>
      </div>

      {/* CURRENT MISSION */}
      {isMissionActive ? (
        <div className="flex-1 flex flex-col gap-4 animate-scale-up">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
              Objetivo en Curso
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
              <span className="text-[9px] text-success font-black uppercase tracking-widest">ACTIVO</span>
            </div>
          </div>

          <div 
            className="p-6 bg-bg/40 border border-border flex-1 flex flex-col group hover:border-primary/20 transition-all duration-500"
            style={{ borderRadius: "var(--theme-radius)" }}
          >
            <h4 className="font-bold text-lg text-text mb-3 group-hover:text-primary transition-colors">{currentMission.title}</h4>
            <p className="text-sm text-text-muted leading-relaxed mb-8 italic">
              "{currentMission.objective}"
            </p>

            <div className="mt-auto space-y-6">
              <div 
                className="bg-surface/50 p-4 border border-border"
                style={{ borderRadius: "var(--theme-radius)" }}
              >
                <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest mb-3">
                  <span className="text-text-muted">Carga de Datos</span>
                  <span className={blocks.length > currentMission.maxBlocks && currentMission.maxBlocks > 0 ? 'text-danger font-black' : 'text-primary'}>
                    {blocks.length} / {currentMission.maxBlocks > 0 ? currentMission.maxBlocks : '∞'}
                  </span>
                </div>
                {currentMission.maxBlocks > 0 && (
                  <div className="h-1.5 w-full bg-bg rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (blocks.length / currentMission.maxBlocks) * 100)}%`,
                        backgroundColor: blocks.length <= currentMission.maxBlocks ? 'var(--primary)' : 'var(--danger)'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dev button */}
          <button
            onClick={completeMission}
            className="text-[9px] font-mono uppercase tracking-[0.3em] py-3 text-text-muted hover:text-primary hover:bg-primary/5 transition-all active:scale-95 border border-dashed border-border mt-2"
            style={{ borderRadius: "var(--theme-radius)" }}
          >
            Sincronizar Finalización
          </button>
        </div>
      ) : (
        <div 
          className="flex-1 flex flex-col justify-center items-center text-center p-8 border border-primary/20 bg-primary/5 animate-fade-in"
          style={{ borderRadius: "var(--theme-radius)" }}
        >
          <div className="text-6xl mb-6 animate-bounce drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)]">🏆</div>
          <h3 className="text-xl font-bold text-text mb-2">Sector Asegurado</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            Todos los protocolos de simulación han sido completados con éxito.
          </p>
          <button 
            className="btn-premium mt-8 w-full py-4 text-xs font-black tracking-[0.2em] active:scale-95"
            style={{ borderRadius: "var(--theme-radius)" }}
          >
            SIGUIENTE NODO →
          </button>
        </div>
      )}

    </div>
  );
};
