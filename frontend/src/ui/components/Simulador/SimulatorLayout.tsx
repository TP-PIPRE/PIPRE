import React, { useState, useCallback, useRef, useEffect } from "react";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";

interface PanelProps {
  visible: boolean;
  defaultWidth: number;
  minWidth?: number;
  maxWidth?: number;
  header?: string;
  children: React.ReactNode;
}

interface SimulatorLayoutProps {
  leftPanel: PanelProps;
  rightPanel: PanelProps;
  centerPanel: React.ReactNode;
  toolbar: React.ReactNode;
}

export const SimulatorLayout = ({
  leftPanel,
  rightPanel,
  centerPanel,
  toolbar,
}: SimulatorLayoutProps) => {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [leftWidth, setLeftWidth] = useState(leftPanel.defaultWidth);
  const [rightWidth, setRightWidth] = useState(rightPanel.defaultWidth);
  const [resizing, setResizing] = useState<"left" | "right" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleResize = useCallback(
    (side: "left" | "right", clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (side === "left") {
        const newWidth = clientX - rect.left;
        const min = leftPanel.minWidth ?? 180;
        const max = leftPanel.maxWidth ?? 400;
        setLeftWidth(Math.max(min, Math.min(max, newWidth)));
      } else {
        const newWidth = rect.right - clientX;
        const min = rightPanel.minWidth ?? 180;
        const max = rightPanel.maxWidth ?? 400;
        setRightWidth(Math.max(min, Math.min(max, newWidth)));
      }
    },
    [leftPanel.minWidth, leftPanel.maxWidth, rightPanel.minWidth, rightPanel.maxWidth]
  );

  useEffect(() => {
    if (!resizing) return;
    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleResize(resizing, e.clientX);
    };
    const onMouseUp = () => setResizing(null);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [resizing, handleResize]);

  return (
    <div ref={containerRef} className="h-full w-full max-w-[1920px] mx-auto flex gap-1.5 relative">
      {/* Left Panel */}
      {leftPanel.visible && (
        <div
          className="flex flex-col shrink-0 rounded-lg overflow-hidden transition-all duration-200 ease-out"
          style={{
            width: leftOpen ? leftWidth : 28,
            minWidth: leftOpen ? undefined : 28,
            backgroundColor: "var(--surface)",
          }}
        >
          <div className="flex items-center h-7 px-2 border-b border-border shrink-0">
            <button
              onClick={() => setLeftOpen(!leftOpen)}
              className="flex items-center gap-1 text-text-muted hover:text-text transition-colors group"
            >
              {leftOpen ? (
                <BsChevronLeft className="text-[8px] group-hover:text-primary transition-colors" />
              ) : (
                <BsChevronRight className="text-[8px] group-hover:text-primary transition-colors" />
              )}
              {leftOpen && (
                <span className="font-mono text-[9px] uppercase tracking-wider">{leftPanel.header}</span>
              )}
            </button>
          </div>
          {leftOpen && (
            <div className="flex-1 min-h-0 overflow-hidden relative">
              <div className="absolute inset-0 overflow-auto">{leftPanel.children}</div>
              <div
                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/40 transition-colors z-10"
                onMouseDown={() => setResizing("left")}
              />
            </div>
          )}
        </div>
      )}

      {/* Center + Toolbar */}
      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        {/* Center */}
        <div className="flex-1 min-h-0 rounded-lg overflow-hidden" style={{ backgroundColor: "var(--surface)" }}>
          {centerPanel}
        </div>

        {/* Toolbar */}
        <div className="shrink-0 rounded-lg" style={{ backgroundColor: "var(--surface)" }}>
          {toolbar}
        </div>
      </div>

      {/* Right Panel */}
      {rightPanel.visible && (
        <div
          className="flex flex-col shrink-0 rounded-lg overflow-hidden transition-all duration-200 ease-out"
          style={{
            width: rightOpen ? rightWidth : 28,
            minWidth: rightOpen ? undefined : 28,
            backgroundColor: "var(--surface)",
          }}
        >
          <div className="flex items-center h-7 px-2 border-b border-border shrink-0">
            <button
              onClick={() => setRightOpen(!rightOpen)}
              className="flex items-center gap-1 text-text-muted hover:text-text transition-colors group ml-auto"
            >
              {rightOpen && (
                <span className="font-mono text-[9px] uppercase tracking-wider">{rightPanel.header}</span>
              )}
              {rightOpen ? (
                <BsChevronRight className="text-[8px] group-hover:text-primary transition-colors" />
              ) : (
                <BsChevronLeft className="text-[8px] group-hover:text-primary transition-colors" />
              )}
            </button>
          </div>
          {rightOpen && (
            <div className="flex-1 min-h-0 overflow-hidden relative">
              <div className="absolute inset-0 overflow-auto">{rightPanel.children}</div>
              <div
                className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/40 transition-colors z-10"
                onMouseDown={() => setResizing("right")}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
