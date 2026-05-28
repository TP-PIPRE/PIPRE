import { useSimulador } from '../../../application/context/SimuladorProvider';
import { CelebrationOverlay } from './CelebrationOverlay';

export const MissionsPanel = () => {
  const {
    energy,
    score,
    missions,
    currentMissionIndex,
    blocks,
    completeMission,
    isRunning,
    isFreeMode,
    challengeCompleted,
    lastScore,
    challengeData,
    dismissChallengeCompletion,
  } = useSimulador();

  const currentMission = missions[currentMissionIndex];
  const isMissionActive = currentMission && !currentMission.isCompleted;
  const allMissionsCompleted = missions.length > 0 && missions.every((m) => m.isCompleted);

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

      {/* MISSION PROGRESS */}
      {!isFreeMode && missions.length > 0 && (
        <div className="flex flex-col gap-1.5 px-1">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">
            Progreso: {missions.filter((m) => m.isCompleted).length}/{missions.length}
          </div>
          <div className="flex gap-1.5">
            {missions.map((m, i) => (
              <div
                key={m.id}
                className="flex-1 h-1 rounded-full transition-all duration-500"
                style={{
                  backgroundColor: m.isCompleted
                    ? "var(--success)"
                    : i === currentMissionIndex
                      ? "var(--primary)"
                      : "var(--border)",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* CURRENT MISSION */}
      {isMissionActive && !allMissionsCompleted ? (
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
        </div>
      ) : allMissionsCompleted && !isFreeMode ? (
        <div 
          className="flex-1 flex flex-col justify-center items-center text-center p-8 border border-success/20 bg-success/5 animate-fade-in"
          style={{ borderRadius: "var(--theme-radius)" }}
        >
          <div className="text-6xl mb-6 drop-shadow-[0_0_15px_rgba(var(--success-rgb),0.4)]">🏆</div>
          <h3 className="text-xl font-bold text-text mb-2">Sector Asegurado</h3>
          <p className="text-xs text-text-muted leading-relaxed mb-6">
            Todas las misiones han sido completadas con éxito.
          </p>
          <div className="text-lg font-black text-success mb-6">
            Puntaje final: {score.toLocaleString()} pts
          </div>
        </div>
      ) : (
        <div 
          className="flex-1 flex flex-col justify-center items-center text-center p-8 border border-border/20 bg-bg/30 animate-fade-in"
          style={{ borderRadius: "var(--theme-radius)" }}
        >
          <div className="text-4xl mb-4 opacity-30">⚡</div>
          <p className="text-xs text-text-muted leading-relaxed">
            {isFreeMode
              ? "Modo libre — ensambla tu robot y programa bloques."
              : "Selecciona un reto para comenzar."}
          </p>
        </div>
      )}

      {/* Celebration overlay */}
      {challengeCompleted && challengeData && (
        <CelebrationOverlay
          score={lastScore}
          blocks={blocks.length}
          energy={Math.round(energy)}
          challengeTitle={challengeData.title}
          onNext={dismissChallengeCompletion}
          onExit={dismissChallengeCompletion}
        />
      )}
    </div>
  );
};
