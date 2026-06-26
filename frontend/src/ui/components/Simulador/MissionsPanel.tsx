import { useSimulador } from '../../../application/context/SimuladorProvider';
import { CelebrationOverlay } from './CelebrationOverlay';
import { BsTrophyFill, BsLightningFill, BsStarFill, BsCheckCircleFill } from 'react-icons/bs';

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
  const energyColor = energy > 50 ? 'var(--primary)' : energy > 20 ? 'var(--accent)' : 'var(--danger)';

  return (
    <div
      className="flex flex-col gap-2 h-full overflow-y-auto p-2"
      style={{ color: "var(--text)" }}
    >
      <div className="flex items-center gap-2 pb-1.5 border-b" style={{ borderColor: "var(--border)" }}>
        <BsTrophyFill className="text-[10px]" style={{ color: "var(--accent)" }} />
        <h1 className="text-[10px] font-bold tracking-tight leading-none uppercase" style={{ color: "var(--text)" }}>Misiones</h1>
        {missions.length > 0 && (
          <span className="ml-auto font-mono text-[8px] text-text-muted/60" style={{ fontVariantNumeric: "tabular-nums" }}>
            {completedCount}/{missions.length}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <div className="p-1.5 border simulador-panel">
          <div className="flex items-center gap-1 text-[8px] text-text-muted font-bold uppercase tracking-widest mb-1 leading-none">
            <BsLightningFill className="text-[9px]" />
            <span>Energía</span>
            <span className="ml-auto font-black" style={{ color: energyColor }}>
              {Math.round(energy)}%
            </span>
          </div>
          <div className="h-1 w-full bg-surface-brighter rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-1000"
              style={{
                width: `${energy}%`,
                backgroundColor: energyColor,
                boxShadow: energy > 20 ? `0 0 4px ${energyColor}` : "none",
              }}
            />
          </div>
        </div>

        <div className="p-1.5 border simulador-panel flex items-center gap-1.5">
          <BsStarFill className="text-[10px]" style={{ color: "var(--accent)" }} />
          <div>
            <div className="text-[7px] text-text-muted font-bold uppercase tracking-widest leading-none">Puntuación</div>
            <div className="text-sm font-black leading-none mt-0.5" style={{ color: "var(--primary)" }}>
              {score.toLocaleString('es-ES')}
            </div>
          </div>
        </div>
      </div>

      {!isFreeMode && missions.length > 0 && (
        <div className="flex gap-1">
          {missions.map((m, i) => {
            const isDone = m.isCompleted;
            const isCurrent = i === currentMissionIndex && !isDone;
            return (
              <div
                key={m.id}
                className="flex-1 flex flex-col items-center gap-0.5"
                title={`${m.title}${isDone ? " (completada)" : isCurrent ? " (activa)" : ""}`}
              >
                <div
                  className={`w-full h-1 rounded-full transition-all duration-500 ${
                    isDone ? "bg-success" : isCurrent ? "bg-primary" : "bg-border"
                  }`}
                />
                <span className={`font-mono text-[6px] ${isDone ? "text-success" : isCurrent ? "text-primary" : "text-text-muted/40"}`}>
                  {i + 1}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {isMissionActive && !allMissionsCompleted ? (
        <div className="flex-1 flex flex-col gap-1.5 min-h-0">
          <div className="flex items-center justify-between">
            <h3 className="text-[8px] font-bold text-text-muted uppercase tracking-widest leading-none">Objetivo</h3>
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-success/10 border border-success/20" style={{ borderRadius: "var(--theme-radius)" }}>
              <div className="w-1 h-1 bg-success rounded-full animate-pulse" />
              <span className="text-[7px] text-success font-black uppercase tracking-widest leading-none">ACTIVO</span>
            </div>
          </div>

          <div
            className="flex-1 border simulador-panel flex flex-col overflow-hidden"
            style={{ borderLeft: `3px solid var(--primary)` }}
          >
            <div className="p-2 flex flex-col gap-1.5 flex-1">
              <h4 className="font-bold text-[11px] leading-tight" style={{ color: "var(--text)" }}>
                {currentMission.title}
              </h4>
              <p className="text-[8px] text-text-muted leading-relaxed italic">
                "{currentMission.objective}"
              </p>

              <div className="mt-auto pt-1.5 border-t border-border/30">
                <div className="flex items-center gap-1.5 text-[8px]">
                  <div className="flex justify-between flex-1 items-center gap-1">
                    <span className="text-text-muted uppercase tracking-widest font-bold text-[7px]">Bloques</span>
                    <span className={`font-black font-mono ${currentMission.maxBlocks > 0 && blocks.length > currentMission.maxBlocks ? 'text-danger' : 'text-primary'}`}>
                      {blocks.length}{currentMission.maxBlocks > 0 ? `/${currentMission.maxBlocks}` : ''}
                    </span>
                  </div>
                </div>
                {currentMission.maxBlocks > 0 && (
                  <div className="h-0.5 w-full bg-bg rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full transition-all duration-500"
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
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-2 p-4 border border-success/20 bg-success/5 simulador-panel">
          <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
            <BsCheckCircleFill className="text-success text-sm" />
          </div>
          <div>
            <h4 className="text-xs font-bold" style={{ color: "var(--text)" }}>Sector Asegurado</h4>
            <p className="text-[8px] text-text-muted mt-0.5">Todas las misiones completadas.</p>
          </div>
          <div className="text-xs font-black text-success">{score.toLocaleString()} pts</div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center items-center text-center p-4 gap-1 border border-border/20 bg-bg/30 simulador-panel">
          <BsLightningFill className="text-lg opacity-20" />
          <p className="text-[8px] text-text-muted/60 leading-relaxed">
            {isFreeMode
              ? "Modo libre — ensambla tu robot y programa bloques."
              : "Selecciona un reto para comenzar."}
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
