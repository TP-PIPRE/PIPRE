import { Lightbulb, X } from "lucide-react";

interface HintToastProps {
  message: string;
  onClose: () => void;
}

export const HintToast = ({
  message,
  onClose,
}: HintToastProps) => {
  return (
    <div role="status" className="pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border border-border bg-surface p-4 shadow-lg">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Lightbulb size={18} aria-hidden="true" />
      </div>
      <p className="flex-1 text-sm text-text">{message}</p>
      <button
        onClick={onClose}
        aria-label="Cerrar"
        className="rounded-md p-1 text-text-muted transition-colors hover:text-text">
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
};
