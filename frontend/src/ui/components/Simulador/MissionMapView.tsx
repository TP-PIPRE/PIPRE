import { useRef, useEffect, useState, useCallback } from "react";
import { useSimulador } from "../../../application/context/SimuladorProvider";
import { generateStage, type StageLayout, type StageCell } from "../../../application/adapters/StageGenerator";
import { BsZoomIn, BsZoomOut, BsArrowsMove, BsCheckCircleFill, BsStarFill } from "react-icons/bs";

const COLORS: Record<string, { fill: string; stroke: string }> = {
  empty: { fill: "rgba(0,0,0,0.02)", stroke: "rgba(100,100,120,0.08)" },
  wall: { fill: "rgba(100,100,120,0.3)", stroke: "rgba(100,100,120,0.5)" },
  start: { fill: "#22c55e", stroke: "rgba(34,197,94,0.3)" },
  target: { fill: "#ef4444", stroke: "rgba(239,68,68,0.3)" },
  waypoint: { fill: "#3b82f6", stroke: "rgba(59,130,246,0.3)" },
  collectible: { fill: "#a855f7", stroke: "rgba(168,85,247,0.3)" },
  obstacle: { fill: "#eab308", stroke: "rgba(234,179,8,0.3)" },
};

export const MissionMapView = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    environment,
    isFreeMode,
    engineRef,
    missions,
    currentMissionIndex,
    challengeData,
  } = useSimulador();

  const [stage, setStage] = useState<StageLayout | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, panX: 0, panY: 0 });

  const currentMission = missions[currentMissionIndex];
  const diff = challengeData?.difficulty || "EASY";

  useEffect(() => {
    if (!currentMission || isFreeMode) {
      setStage(null);
      return;
    }
    const s = generateStage(environment, diff, missions.length, currentMissionIndex);
    setStage(s);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [currentMission, currentMissionIndex, environment, isFreeMode, missions.length, diff]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas || !stage) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    const cellSize = Math.min(
      (w - 40) / stage.gridWidth,
      (h - 40) / stage.gridDepth,
      60
    );
    const offsetX = (w - stage.gridWidth * cellSize) / 2;
    const offsetY = (h - stage.gridDepth * cellSize) / 2;

    ctx.strokeStyle = `rgba(100,100,120,0.04)`;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= stage.gridWidth; i++) {
      ctx.beginPath();
      ctx.moveTo(offsetX + i * cellSize, offsetY);
      ctx.lineTo(offsetX + i * cellSize, offsetY + stage.gridDepth * cellSize);
      ctx.stroke();
    }
    for (let i = 0; i <= stage.gridDepth; i++) {
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + i * cellSize);
      ctx.lineTo(offsetX + stage.gridWidth * cellSize, offsetY + i * cellSize);
      ctx.stroke();
    }

    stage.cells.forEach((cell: StageCell) => {
      const cx = offsetX + cell.x * cellSize;
      const cy = offsetY + cell.z * cellSize;
      const color = COLORS[cell.type] || COLORS.empty;

      ctx.fillStyle = color.fill;
      ctx.strokeStyle = color.stroke;
      ctx.lineWidth = 1;

      const pad = 2;

      switch (cell.type) {
        case "wall":
          ctx.fillRect(cx + pad, cy + pad, cellSize - pad * 2, cellSize - pad * 2);
          break;
        case "start":
          ctx.beginPath();
          ctx.arc(cx + cellSize / 2, cy + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.font = `bold ${cellSize / 3}px monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("S", cx + cellSize / 2, cy + cellSize / 2);
          break;
        case "target":
          const pulse = Math.sin(Date.now() / 300) * 0.2 + 0.8;
          ctx.fillStyle = `rgba(239,68,68,${pulse})`;
          ctx.beginPath();
          ctx.arc(cx + cellSize / 2, cy + cellSize / 2, cellSize / 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.font = `bold ${cellSize / 3}px monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("F", cx + cellSize / 2, cy + cellSize / 2);
          break;
        case "waypoint":
          ctx.fillStyle = COLORS.waypoint.fill;
          ctx.beginPath();
          ctx.arc(cx + cellSize / 2, cy + cellSize / 2, cellSize / 4, 0, Math.PI * 2);
          ctx.fill();
          if (cell.label) {
            ctx.fillStyle = "rgba(59,130,246,0.6)";
            ctx.font = `${cellSize / 4}px monospace`;
            ctx.textAlign = "center";
            ctx.fillText(cell.label, cx + cellSize / 2, cy - 4);
          }
          break;
        case "collectible":
          const glow = Math.sin(Date.now() / 400 + cell.x) * 0.3 + 0.7;
          ctx.fillStyle = `rgba(168,85,247,${glow})`;
          ctx.beginPath();
          ctx.arc(cx + cellSize / 2, cy + cellSize / 2, cellSize / 5, 0, Math.PI * 2);
          ctx.fill();
          break;
        case "obstacle":
          ctx.fillStyle = "rgba(234,179,8,0.5)";
          const s = cellSize / 3;
          ctx.beginPath();
          ctx.moveTo(cx + cellSize / 2, cy + cellSize / 2 - s);
          ctx.lineTo(cx + cellSize / 2 + s, cy + cellSize / 2 + s);
          ctx.lineTo(cx + cellSize / 2 - s, cy + cellSize / 2 + s);
          ctx.closePath();
          ctx.fill();
          break;
      }
    });

    if (stage.waypoints.length > 1) {
      ctx.strokeStyle = "rgba(59,130,246,0.15)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      const first = stage.waypoints[0];
      ctx.moveTo(offsetX + first.x * cellSize + cellSize / 2, offsetY + first.z * cellSize + cellSize / 2);
      for (let i = 1; i < stage.waypoints.length; i++) {
        const wp = stage.waypoints[i];
        ctx.lineTo(offsetX + wp.x * cellSize + cellSize / 2, offsetY + wp.z * cellSize + cellSize / 2);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const engine = engineRef.current;
    if (engine && engine.getState) {
      const state = engine.getState();
      if (state) {
        const sx = (state.x as number) || 0;
        const sz = (state.z as number) || 0;
        const px = offsetX + sx * (cellSize / 10) + cellSize / 2;
        const py = offsetY - sz * (cellSize / 10) + cellSize / 2;

        ctx.save();
        ctx.fillStyle = "#00f5d4";
        ctx.shadowColor = "#00f5d4";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();

        const angle = (state.angle as number) || 0;
        ctx.rotate(-((angle * Math.PI) / 180));
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.moveTo(px + 10, py);
        ctx.lineTo(px + 2, py - 4);
        ctx.lineTo(px + 2, py + 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.restore();
  }, [stage, zoom, pan, engineRef]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resize();
    window.addEventListener("resize", resize);
    let anim: number;
    const loop = () => {
      render();
      anim = requestAnimationFrame(loop);
    };
    anim = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(anim);
      window.removeEventListener("resize", resize);
    };
  }, [render]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.max(0.3, Math.min(5, z * delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPan({ x: dragRef.current.panX + dx, y: dragRef.current.panY + dy });
  };

  const handleMouseUp = () => setIsPanning(false);

  if (isFreeMode) {
    return (
      <div className="flex flex-col items-center justify-center h-full font-mono" style={{ color: "var(--text-muted)" }}>
        <span className="text-[10px] uppercase tracking-widest">
          Selecciona un reto para explorar el mapa
        </span>
      </div>
    );
  }

  if (!stage) {
    return (
      <div className="flex flex-col items-center justify-center h-full font-mono" style={{ color: "var(--text-muted)" }}>
        <span className="text-[10px] uppercase tracking-widest">
          Generando mapa...
        </span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <div
        className="absolute top-2 left-2 z-10 flex items-center gap-2 px-3 py-1.5 rounded-md text-[8px] font-mono uppercase tracking-widest"
        style={{ backgroundColor: "rgba(0,0,0,0.75)", color: "var(--text-muted)" }}
      >
        <BsCheckCircleFill className="text-[9px] text-success" />
        {currentMission?.title || "Misión"}
        {currentMission && (
          <span className="text-primary ml-1">{currentMissionIndex + 1}/{missions.length}</span>
        )}
        <span className="text-accent ml-1">· {stage.pattern}</span>
      </div>

      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <button
          onClick={() => setZoom((z) => Math.min(5, z * 1.3))}
          className="p-1.5 rounded-md transition-colors"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "var(--text)" }}
        >
          <BsZoomIn className="text-[10px]" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.3, z / 1.3))}
          className="p-1.5 rounded-md transition-colors"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "var(--text)" }}
        >
          <BsZoomOut className="text-[10px]" />
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="p-1.5 rounded-md transition-colors"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "var(--text)" }}
        >
          <BsArrowsMove className="text-[10px]" />
        </button>
      </div>

      {currentMission && (
        <div
          className="absolute bottom-2 left-2 right-2 z-10 px-3 py-2 rounded-md text-[8px] font-mono"
          style={{ backgroundColor: "rgba(0,0,0,0.75)", color: "var(--text-muted)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <BsStarFill className="text-[9px] text-accent" />
            <span className="text-text font-semibold">Objetivo:</span>
            <span className="text-accent/80 ml-auto">{stage.iterationHint}</span>
          </div>
          <div className="text-text/80">{currentMission.objective}</div>
        </div>
      )}

      <div className="absolute bottom-2 right-2 z-10 flex flex-col gap-0.5 px-2 py-1.5 rounded-md text-[7px] font-mono" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#22c55e]" /><span className="text-text-muted">Inicio</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#3b82f6]" /><span className="text-text-muted">Waypoint</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#ef4444]" /><span className="text-text-muted">Meta</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#a855f7]" /><span className="text-text-muted">Recurso</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-[#eab308]" style={{ width: 6, height: 6, clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }} /><span className="text-text-muted">Obstáculo</span></div>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ cursor: isPanning ? "grabbing" : "grab" }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
};
