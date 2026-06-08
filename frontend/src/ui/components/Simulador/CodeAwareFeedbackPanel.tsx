import type { CodeFeedbackResponse } from "../../../shared/types/CodeFeedback";

interface CodeAwareFeedbackPanelProps {
  feedback: CodeFeedbackResponse;
  onClose?: () => void;
}

const severityConfig = {
  info: { bg: "bg-primary/5", border: "border-primary/20", dot: "bg-primary" },
  warning: {
    bg: "bg-warning/5",
    border: "border-warning/20",
    dot: "bg-warning",
  },
  error: { bg: "bg-danger/5", border: "border-danger/20", dot: "bg-danger" },
};

export const CodeAwareFeedbackPanel = ({
  feedback,
  onClose,
}: CodeAwareFeedbackPanelProps) => {
  return (
    <div
      className="bg-surface border border-border p-6 animate-fade-in"
      style={{ borderRadius: "var(--theme-radius)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] uppercase font-bold tracking-widest text-text-muted">
          Feedback de Código
        </h3>
        <span className="text-[9px] text-text-muted italic">
          {feedback.generated_by}
        </span>
      </div>

      {/* Summary */}
      <div className="p-4 bg-bg border border-border mb-4">
        <p className="text-sm text-text leading-relaxed">
          {feedback.feedback_summary}
        </p>
      </div>

      {/* Score */}
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-bg border border-border flex-1 text-center">
          <div className="text-lg font-black text-primary">
            {feedback.predicted_score}
          </div>
          <div className="text-[8px] text-text-muted uppercase tracking-wider mt-0.5">
            Puntaje
          </div>
        </div>
      </div>

      {/* Hints */}
      {feedback.hints.length > 0 && (
        <div className="mb-4">
          <h4 className="text-[10px] uppercase font-bold tracking-widest text-text-muted mb-2">
            Pistas ({feedback.hints.length})
          </h4>
          <div className="flex flex-col gap-2">
            {feedback.hints.map((hint, i) => {
              const cfg = severityConfig[hint.severity];
              return (
                <div
                  key={i}
                  className={`p-3 border ${cfg.bg} ${cfg.border} flex items-start gap-3`}
                  style={{ borderRadius: "var(--theme-radius)" }}
                >
                  <span
                    className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${cfg.dot}`}
                  />
                  <div>
                    <p className="text-sm text-text">{hint.message}</p>
                    {(hint.block_type || hint.line !== undefined) && (
                      <div className="text-[10px] text-text-muted mt-1">
                        {hint.block_type && `Bloque: ${hint.block_type}`}
                        {hint.block_type && hint.line !== undefined && " · "}
                        {hint.line !== undefined && `Línea: ${hint.line}`}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detected Patterns */}
      {feedback.detected_patterns.length > 0 && (
        <div className="mb-4">
          <h4 className="text-[10px] uppercase font-bold tracking-widest text-text-muted mb-2">
            Patrones Detectados
          </h4>
          <div className="flex flex-wrap gap-2">
            {feedback.detected_patterns.map((p, i) => (
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

      {/* Suggested Blocks */}
      {feedback.suggested_blocks.length > 0 && (
        <div>
          <h4 className="text-[10px] uppercase font-bold tracking-widest text-text-muted mb-2">
            Bloques Sugeridos
          </h4>
          <div className="flex flex-wrap gap-2">
            {feedback.suggested_blocks.map((b, i) => (
              <span
                key={i}
                className="px-2.5 py-1 text-[10px] font-semibold bg-primary/10 border border-primary/20 text-primary"
                style={{ borderRadius: "var(--theme-radius)" }}
              >
                {b}
              </span>
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
