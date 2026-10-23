import { Bot as BsRobot, X as BsXLg } from "lucide-react";

export interface AiFeedbackToastProps {
  message: string;
  onClose: () => void;
}

export const AiFeedbackToast: React.FC<AiFeedbackToastProps> = ({
  message,
  onClose,
}) => {
  return (
    <div role="status" className="pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border border-border bg-surface p-4 shadow-lg">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <BsRobot className="text-base" />
      </div>
      <p className="flex-1 text-sm text-text">{message}</p>
      <button
        onClick={onClose}
        aria-label="Cerrar"
        className="rounded-md p-1 text-text-muted transition-colors hover:text-text">
        <BsXLg className="text-xs" />
      </button>
    </div>
  );
};
