import React, { useState, useRef, useCallback, useEffect } from "react";
import { BsDash, BsArrowsFullscreen, BsFullscreenExit, BsCode } from "react-icons/bs";

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface FloatingWorkspaceProps {
  children: React.ReactNode;
  title?: string;
  defaultPosition?: Position;
  defaultSize?: Size;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  zIndex?: number;
  onPositionChange?: (pos: Position) => void;
  onSizeChange?: (size: Size) => void;
  constrainToRef?: React.RefObject<HTMLDivElement | null>;
}

export const FloatingWorkspace: React.FC<FloatingWorkspaceProps> = ({
  children,
  title = "Ensamblaje Lógico",
  defaultPosition = { x: 100, y: 100 },
  defaultSize = { width: 600, height: 400 },
  minWidth = 300,
  minHeight = 200,
  maxWidth = 1200,
  maxHeight = 800,
  zIndex = 100,
  onPositionChange,
  onSizeChange,
  constrainToRef,
}) => {
  const [position, setPosition] = useState<Position>(defaultPosition);
  const [size, setSize] = useState<Size>(defaultSize);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });

  const SNAP_THRESHOLD = 20;

  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isMaximized) return;
      setIsDragging(true);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    },
    [isMaximized]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging && !isMaximized) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        if (constrainToRef?.current) {
          const parentRect = constrainToRef.current.getBoundingClientRect();
          let relX = newX - parentRect.left;
          let relY = newY - parentRect.top;
          
          const currentWidth = isMinimized ? 180 : size.width;
          const currentHeight = isMinimized ? 50 : size.height;
          const maxRelX = parentRect.width - currentWidth;
          const maxRelY = parentRect.height - currentHeight;
          
          relX = Math.max(0, Math.min(relX, maxRelX));
          relY = Math.max(0, Math.min(relY, maxRelY));
          
          setPosition({ x: relX, y: relY });
          onPositionChange?.({ x: relX, y: relY });
        } else {
          setPosition({ x: newX, y: newY });
          onPositionChange?.({ x: newX, y: newY });
        }
      }

      if (isResizing) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          let newWidth = e.clientX - rect.left;
          let newHeight = e.clientY - rect.top;
          
          if (constrainToRef?.current) {
            const parentRect = constrainToRef.current.getBoundingClientRect();
            const maxWidthConstrained = parentRect.width - position.x;
            const maxHeightConstrained = parentRect.height - position.y;
            
            newWidth = Math.max(minWidth, Math.min(maxWidthConstrained, newWidth));
            newHeight = Math.max(minHeight, Math.min(maxHeightConstrained, newHeight));
          } else {
            newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
            newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
          }
          
          setSize({ width: newWidth, height: newHeight });
          onSizeChange?.({ width: newWidth, height: newHeight });
        }
      }
    },
    [isDragging, isResizing, dragOffset, isMaximized, minWidth, minHeight, maxWidth, maxHeight, onPositionChange, onSizeChange, constrainToRef, isMinimized, size.width, size.height, position.x, position.y]
  );

  const snapToEdge = useCallback(
    (pos: Position, currentSize: Size, parentSize: { width: number; height: number }): Position => {
      let { x, y } = pos;
      const snapDist = SNAP_THRESHOLD;

      if (x < snapDist) x = 0;
      else if (x + currentSize.width > parentSize.width - snapDist)
        x = parentSize.width - currentSize.width;

      if (y < snapDist) y = 0;
      else if (y + currentSize.height > parentSize.height - snapDist)
        y = parentSize.height - currentSize.height;

      return { x, y };
    },
    []
  );

  const handleMouseUp = useCallback(() => {
    if ((isDragging || isResizing) && constrainToRef?.current) {
      const parentRect = constrainToRef.current.getBoundingClientRect();
      const currentSize = {
        width: isMinimized ? 180 : size.width,
        height: isMinimized ? 50 : size.height,
      };
      const snapped = snapToEdge(position, currentSize, {
        width: parentRect.width,
        height: parentRect.height,
      });

      if (snapped.x !== position.x || snapped.y !== position.y) {
        setIsSnapping(true);
        setPosition(snapped);
        onPositionChange?.(snapped);
        setTimeout(() => setIsSnapping(false), 300);
      }
    }
    setIsDragging(false);
    setIsResizing(false);
  }, [isDragging, isResizing, constrainToRef, position, size, isMinimized, snapToEdge, onPositionChange]);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isMaximized) return;
      setIsResizing(true);
    },
    [isMaximized]
  );

  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
    if (!isMinimized) {
      setSize({ width: 200, height: 40 });
    } else {
      setSize(defaultSize);
    }
  }, [isMinimized, defaultSize]);

  const toggleMaximize = useCallback(() => {
    setIsMaximized((prev) => !prev);
    if (!isMaximized) {
      setPosition({ x: 0, y: 0 });
      if (constrainToRef?.current) {
        const parentRect = constrainToRef.current.getBoundingClientRect();
        setSize({
          width: parentRect.width,
          height: parentRect.height,
        });
      } else {
        setSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }
    } else {
      setPosition(defaultPosition);
      setSize(defaultSize);
    }
  }, [isMaximized, defaultPosition, defaultSize, constrainToRef]);

  return (
    <>
      <style>{`
        @keyframes snap-flash {
          0% { box-shadow: 0 0 0 0 rgba(0, 245, 212, 0); }
          30% { box-shadow: 0 0 0 3px rgba(0, 245, 212, 0.4); }
          100% { box-shadow: 0 0 0 0 rgba(0, 245, 212, 0); }
        }
        .snap-flash {
          animation: snap-flash 0.3s ease-out;
        }
      `}</style>
    <div
      ref={containerRef}
      className={`absolute rounded-lg shadow-2xl overflow-hidden flex flex-col ${
        isSnapping ? "snap-flash" : ""
      }`}
      style={{
        left: isMaximized
          ? 0
          : constrainToRef?.current
          ? position.x
          : Math.max(0, Math.min(position.x, window.innerWidth - (isMinimized ? 180 : size.width))),
        top: isMaximized
          ? 0
          : constrainToRef?.current
          ? position.y
          : Math.max(0, Math.min(position.y, window.innerHeight - (isMinimized ? 50 : size.height))),
        width: isMaximized ? "100%" : isMinimized ? 180 : size.width,
        height: isMaximized ? "100%" : isMinimized ? 50 : size.height,
        zIndex: isMaximized ? 9999 : zIndex,
        backgroundColor: "var(--surface)",
        border: isMaximized ? "none" : "1px solid var(--border)",
        transition: isDragging || isResizing ? "none" : "all 0.2s ease",
        cursor: isDragging ? "grabbing" : "default",
      }}
    >
      {isMinimized ? (
        <div
          ref={headerRef}
          className="flex items-center justify-between px-2 py-1.5 cursor-grab active:cursor-grabbing select-none h-full"
          style={{ backgroundColor: "var(--surface-brighter)" }}
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-1.5">
            <BsCode className="text-sm text-primary" />
            <span className="font-semibold text-xs text-text uppercase tracking-wider">
              {title}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMinimize();
              }}
              className="p-1 hover:bg-surface rounded transition-colors flex items-center justify-center"
              title="Restaurar"
            >
              <BsArrowsFullscreen className="text-[8px] text-text-muted" />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            ref={headerRef}
            className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0 cursor-grab active:cursor-grabbing select-none"
            style={{ backgroundColor: "var(--surface-brighter)" }}
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-2">
              <BsCode className="text-base text-primary" />
              <span className="font-semibold text-xs text-text uppercase tracking-wider">
                {title}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMinimize();
                }}
                className="p-1.5 hover:bg-surface rounded transition-colors flex items-center justify-center"
                title="Minimizar"
              >
                <BsDash className="text-[14px] text-text-muted" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMaximize();
                }}
                className="p-1.5 hover:bg-surface rounded transition-colors flex items-center justify-center"
                title={isMaximized ? "Restaurar" : "Maximizar"}
              >
                {isMaximized ? (
                  <BsFullscreenExit className="text-[10px] text-text-muted" />
                ) : (
                  <BsArrowsFullscreen className="text-[10px] text-text-muted" />
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">{children}</div>

          {!isMaximized && (
            <div
              className="absolute right-0 bottom-0 w-4 h-4 cursor-se-resize hover:bg-primary/30 transition-colors"
              onMouseDown={handleResizeStart}
            >
              <div className="absolute right-1 bottom-1 w-2 h-2 border-r-2 border-b-2 border-text-muted/30" />
            </div>
          )}
        </>
      )}
    </div>
    </>
  );
};
