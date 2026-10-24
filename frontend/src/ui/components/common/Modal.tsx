import React, { useEffect, useRef, useId } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  height?: string;
  zIndex?: number;
  title?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  maxWidth = "max-w-3xl",
  height,
  zIndex = 2000,
  title = "Detalles",
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (isOpen && panelRef.current && !panelRef.current.contains(document.activeElement)) panelRef.current.focus();
  });

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = panelRef.current;
    panel?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key !== "Tab" || !panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')).filter(el => el.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first) { e.preventDefault(); return; }
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || document.activeElement === panel)) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="app-modal fixed inset-0 flex items-center justify-center bg-black/60 p-3 md:p-8"
      style={{ zIndex }}
      onClick={(e) => {
        if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
          onClose();
        }
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`w-full ${maxWidth} border border-border shadow-[0_32px_64px_-16px_var(--primary-glow)] relative animate-scale-up-soft overflow-hidden flex flex-col`}
        style={{
          backgroundColor: "var(--surface)",
          borderRadius: "var(--theme-radius)",
          height: height || "auto",
          maxHeight: "calc(100vh - 4rem)",
        }}
      >
        <span id={titleId} className="sr-only">{title}</span>
        {/* Close button */}
        <div className="flex shrink-0 justify-end border-b border-border px-3 py-2">
        <button
          onClick={onClose}
          className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-brighter text-text-muted hover:text-text hover:bg-surface transition-all duration-300"
          aria-label="Cerrar"
        >
          <span className="text-xl">×</span>
        </button>
        </div>

        {/* Content — scrollable if needed */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
};
