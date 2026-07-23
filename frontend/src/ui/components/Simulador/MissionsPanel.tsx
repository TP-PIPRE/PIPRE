import { useSimulador } from '../../../application/context/SimuladorProvider';
import { CelebrationOverlay } from './CelebrationOverlay';
import { BsTrophyFill, BsLightningFill, BsStarFill, BsCheckCircleFill, BsFlagFill } from 'react-icons/bs';

export const MissionsPanel = () => {
  const {
    energy,
    score,
    missions,
    currentMissionIndex,
    blocks,
    isFreeMode,
    challengeCompleted,
    lastScore,
    lastStars,
    challengeData,
    dismissChallengeCompletion,
  } = useSimulador();

  const currentMission = missions[currentMissionIndex];
  const isMissionActive = currentMission && !currentMission.isCompleted;
  const allMissionsCompleted = missions.length > 0 && missions.every((m) => m.isCompleted);
  const completedCount = missions.filter((m) => m.isCompleted).length;
  const energyColor = energy > 50 ? 'var(--success)' : energy > 20 ? 'var(--accent)' : 'var(--danger)';

  const renderStars = (count: number) => {
    return Array.from({ length: 3 }, (_, i) => (
      <BsStarFill
        key={i}
        className={`text-base ${i < count ? 'text-amber-400' : 'text-border/30'}`}
      />
    ));
  };

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto p-3" style={{ color: "var(--text)" }}>
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <BsTrophyFill className="text-sm text-amber-400" />
        <h2 className="text-xs font-bold tracking-wide uppercase text-text">Misiones</h2>
        {missions.length > 0 && (
          <span className="ml-auto font-bold text-[11px] text-text-muted/60">
            {completedCount}/{missions.length}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {missions.length > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-text-muted font-bold">
            <span>Progreso</span>
            <span>{Math.round((completedCount / missions.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-border/30 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.round((completedCount / missions.length) * 100)}%`,
                backgroundColor: allMissionsCompleted ? 'var(--success)' : 'var(--primary)',
              }}
            />
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-xl border border-border bg-surface/50">
          <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-bold uppercase tracking-wider mb-1">
            <BsLightningFill className="text-xs" style={{ color: energyColor }} />
            <span>Energia</span>
            <span className="ml-auto font-black text-sm" style={{ color: energyColor }}>
              {Math.round(energy)}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-bg rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-1000 rounded-full"
              style={{ width: `${energy}%`, backgroundColor: energyColor }}
            />
          </div>
        </div>

        <div className="p-2.5 rounded-xl border border-border bg-surface/50 flex items-center gap-2">
          <BsStarFill className="text-base text-amber-400" />
          <div>
            <div className="text-[10px] text-text-muted font-bold uppercase leading-none">Puntos</div>
            <div className="text-lg font-black leading-none mt-0.5 text-primary">
              {score.toLocaleString('es-ES')}
            </div>
          </div>
        </div>
      </div>

      {/* Mission steps */}
      {!isFreeMode && missions.length > 0 && (
        <div className="flex gap-1">
          {missions.map((m, i) => {
            const isDone = m.isCompleted;
            const isCurrent = i === currentMissionIndex && !isDone;
            return (
              <button
                key={m.id}
                className="flex-1 flex flex-col items-center gap-0.5"
                title={`${m.title}${isDone ? ' ✓' : isCurrent ? ' ▶' : ''}`}
              >
                <div
                  className={`w-full h-1.5 rounded-full transition-all duration-500 ${
                    isDone ? 'bg-success shadow-sm shadow-success/30' : isCurrent ? 'bg-primary shadow-sm shadow-primary/30' : 'bg-border/40'
                  }`}
                />
                <span
                  className={`text-[10px] font-bold ${
                    isDone ? 'text-success' : isCurrent ? 'text-primary' : 'text-text-muted/30'
                  }`}
                >
                  {i + 1}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Current mission detail */}
      {isMissionActive && !allMissionsCompleted ? (
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Objetivo actual</h3>
            <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-green-500 font-bold uppercase">Activo</span>
            </div>
          </div>

          <div className="flex-1 rounded-xl border border-border bg-surface/50 flex flex-col overflow-hidden" style={{ borderLeft: '3px solid var(--primary)' }}>
            <div className="p-3 flex flex-col gap-2 flex-1">
              <div className="flex items-start gap-2">
                <BsFlagFill className="text-sm text-primary mt-0.5 shrink-0" />
                <h4 className="font-bold text-sm text-text leading-tight">{currentMission.title}</h4>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">
                {currentMission.objective}
              </p>

              <div className="mt-auto pt-2 border-t border-border/30">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-text-muted font-bold uppercase">Bloques usados</span>
                  <span className={`font-black ${currentMission.maxBlocks > 0 && blocks.length > currentMission.maxBlocks ? 'text-red-400' : 'text-primary'}`}>
                    {blocks.length}{currentMission.maxBlocks > 0 ? ` / ${currentMission.maxBlocks} max` : ''}
                  </span>
                </div>
                {currentMission.maxBlocks > 0 && (
                  <div className="h-1.5 w-full bg-bg rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (blocks.length / currentMission.maxBlocks) * 100)}%`,
                        backgroundColor: blocks.length <= currentMission.maxBlocks ? 'var(--primary)' : 'var(--danger)',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : allMissionsCompleted && !isFreeMode ? (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-3 p-4 rounded-xl border border-green-500/20 bg-green-500/5">
          <div className="w-12 h-12 rounded-full bg-green-500/15 flex items-center justify-center">
            <BsCheckCircleFill className="text-green-500 text-xl" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text">Todas las misiones completadas!</h4>
            <p className="text-[11px] text-text-muted mt-1">Excelente trabajo programando tu robot.</p>
          </div>
          <div className="flex gap-0.5">{renderStars(lastStars || 3)}</div>
          <div className="text-lg font-black text-green-500">{score.toLocaleString()} pts</div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center items-center text-center p-4 gap-2 rounded-xl border border-border/20 bg-bg/30">
          <BsLightningFill className="text-2xl opacity-15" />
          <p className="text-[11px] text-text-muted/50 leading-relaxed">
            {isFreeMode
              ? 'Modo libre: ensambla hardware, programa bloques y explora sin limites.'
              : 'Selecciona un reto del curso para comenzar las misiones.'}
          </p>
        </div>
      )}

      {challengeCompleted && challengeData && (
        <CelebrationOverlay
          score={lastScore}
          blocks={blocks.length}
          energy={Math.round(energy)}
          challengeTitle={challengeData.title}
          stars={lastStars}
          xpEarned={lastScore}
          onNext={dismissChallengeCompletion}
          onExit={dismissChallengeCompletion}
        />
      )}
    </div>
  );
};
