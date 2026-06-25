import React, { useState, useCallback, useEffect } from "react";

interface PanelResizerProps {
  direction: "horizontal" | "vertical";
  onResize: (delta: number) => void;
  className?: string;
}

export const PanelResizer: React.FC<PanelResizerProps> = ({
  direction,
  onResize,
  className = "",
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = direction === "horizontal" ? e.movementX : e.movementY;
      onResize(delta);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, direction, onResize]);

  return (
    <div
      className={`absolute z-20 ${
        direction === "horizontal"
          ? "right-0 top-0 bottom-0 w-1.5 cursor-col-resize"
          : "left-0 right-0 top-0 h-1.5 cursor-row-resize"
      } ${className}`}
      onMouseDown={handleMouseDown}
      style={{
        backgroundColor: isDragging ? "var(--primary)" : "transparent",
        transition: isDragging ? "none" : "background-color 0.2s",
      }}
    >
      <div
        className={`absolute ${
          direction === "horizontal"
            ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-8"
            : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-0.5 w-8"
        } rounded-full`}
        style={{
          backgroundColor: isDragging ? "var(--primary)" : "var(--text-muted)",
          opacity: isDragging ? 1 : 0.3,
          transition: "opacity 0.2s",
        }}
      />
    </div>
  );
};
