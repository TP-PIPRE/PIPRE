import React, { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  /** Height constraint — use for chat-style modals */
  height?: string;
}

/**
 * Reusable modal with:
 *  - Solid container background (no content bleed-through)
 *  - Translucent overlay with blur
 *  - Escape key to close
 *  - Click-outside to close
 *  - Soft entry animation
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  maxWidth = "max-w-lg",
  height,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
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
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-8 animate-fade-in-soft backdrop-blur-md bg-bg/60"
      onClick={(e) => {
        if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
          onClose();
        }
      }}
    >
      <div
        ref={panelRef}
        className={`w-full ${maxWidth} bg-surface-brighter border border-border/20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] relative animate-scale-up-soft overflow-hidden flex flex-col`}
        style={{
          borderRadius: "var(--theme-radius)",
          height: height || "auto",
          maxHeight: "calc(100vh - 4rem)",
        }}
      >
        {/* Decorative Top Accent (Subtle) */}
        <div className="h-1.5 w-full bg-primary/20" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-surface/50 text-text-muted/60 hover:text-danger hover:bg-danger/10 transition-all duration-300"
          aria-label="Cerrar"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Content — scrollable if needed */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
