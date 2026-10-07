import { BsRobot, BsXLg } from "react-icons/bs";

export interface AiFeedbackToastProps {
  message: string;
  onClose: () => void;
}

export const AiFeedbackToast: React.FC<AiFeedbackToastProps> = ({
  message,
  onClose,
}) => {
  return (
    <div className="pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border border-border bg-surface p-3 shadow-lg">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
        <BsRobot className="text-base" />
      </div>
      <p className="flex-1 text-xs font-bold text-text">{message}</p>
      <button
        onClick={onClose}
        aria-label="Cerrar"
        className="rounded-md p-1 text-text-muted transition-colors hover:text-text">
        <BsXLg className="text-xs" />
      </button>
    </div>
  );
};
