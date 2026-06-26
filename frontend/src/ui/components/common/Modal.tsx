import React, { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  height?: string;
  zIndex?: number;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  maxWidth = "max-w-3xl",
  height,
  zIndex = 2000,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 md:p-9 animate-fade-in-soft`}
      style={{ zIndex }}
      onClick={(e) => {
        if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
          onClose();
        }
      }}
    >
      <div
        ref={panelRef}
        className={`w-full ${maxWidth} border border-border shadow-[0_32px_64px_-16px_var(--primary-glow)] relative animate-scale-up-soft overflow-hidden flex flex-col`}
        style={{
          backgroundColor: "var(--surface)",
          borderRadius: "var(--theme-radius)",
          height: height || "auto",
          maxHeight: "calc(100vh - 4rem)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-surface-brighter text-text-muted hover:text-text hover:bg-surface transition-all duration-300"
          aria-label="Cerrar"
        >
          <span className="text-xl">×</span>
        </button>

        {/* Content — scrollable if needed */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
