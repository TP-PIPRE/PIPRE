import type { CodeFeedbackAnalyzeResponse } from "../../../shared/types/SpecContracts";

interface CodeAwareFeedbackPanelProps {
  feedback: CodeFeedbackAnalyzeResponse;
  onClose?: () => void;
}

export const CodeAwareFeedbackPanel = ({
  feedback,
  onClose,
}: CodeAwareFeedbackPanelProps) => {
  const { hints, predicted_score, detected_patterns, mission_feedback, environment_feedback } = feedback;

  return (
    <div
      className="bg-surface border border-border p-6 animate-fade-in"
      style={{ borderRadius: "var(--theme-radius)" }}
    >
      <h3 className="text-[10px] uppercase font-bold tracking-widest text-text-muted mb-4">
        Feedback de Código
      </h3>

      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-bg border border-border flex-1 text-center">
          <div className="text-lg font-black text-primary">
            {predicted_score}
          </div>
          <div className="text-[8px] text-text-muted uppercase tracking-wider mt-0.5">
            Puntaje
          </div>
        </div>
      </div>

      {hints.length > 0 && (
        <div className="mb-4">
          <h4 className="text-[10px] uppercase font-bold tracking-widest text-text-muted mb-2">
            Pistas ({hints.length})
          </h4>
          <div className="flex flex-col gap-2">
            {hints.map((hint, i) => (
              <div
                key={i}
                className="p-3 border border-primary/20 bg-primary/5 flex items-start gap-3"
                style={{ borderRadius: "var(--theme-radius)" }}
              >
                <span className="w-2 h-2 mt-1.5 rounded-full flex-shrink-0 bg-primary" />
                <p className="text-sm text-text">{hint}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {detected_patterns.length > 0 && (
        <div className="mb-4">
          <h4 className="text-[10px] uppercase font-bold tracking-widest text-text-muted mb-2">
            Patrones Detectados
          </h4>
          <div className="flex flex-wrap gap-2">
            {detected_patterns.map((p, i) => (
              <span
                key={i}
                className="px-2.5 py-1 text-[10px] font-semibold bg-bg border border-border text-text-muted uppercase tracking-wider"
                style={{ borderRadius: "var(--theme-radius)" }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {mission_feedback && Object.keys(mission_feedback).length > 0 && (
        <div className="mb-4">
          <h4 className="text-[10px] uppercase font-bold tracking-widest text-text-muted mb-2">
            Feedback de Misiones
          </h4>
          <div className="flex flex-col gap-2">
            {Object.entries(mission_feedback).map(([key, value]) => (
              <div
                key={key}
                className="p-3 border border-accent/20 bg-accent/5"
                style={{ borderRadius: "var(--theme-radius)" }}
              >
                <div className="text-[9px] uppercase font-bold tracking-wider text-accent mb-1">
                  {key}
                </div>
                <p className="text-sm text-text">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {environment_feedback && Object.keys(environment_feedback).length > 0 && (
        <div className="mb-4">
          <h4 className="text-[10px] uppercase font-bold tracking-widest text-text-muted mb-2">
            Feedback del Entorno
          </h4>
          <div className="flex flex-col gap-2">
            {Object.entries(environment_feedback).map(([key, value]) => (
              <div
                key={key}
                className="p-3 border border-primary/20 bg-primary/5"
                style={{ borderRadius: "var(--theme-radius)" }}
              >
                <div className="text-[9px] uppercase font-bold tracking-wider text-primary mb-1">
                  {key}
                </div>
                <p className="text-sm text-text">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {onClose && (
        <button
          onClick={onClose}
          className="mt-6 w-full p-2.5 text-sm border border-border text-text-muted hover:border-primary/40 hover:text-text transition-colors"
          style={{ borderRadius: "var(--theme-radius)" }}
        >
          Cerrar
        </button>
      )}
    </div>
  );
};
