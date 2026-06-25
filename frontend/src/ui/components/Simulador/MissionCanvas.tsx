import { useRef, useEffect, useState } from "react";
import { useSimulador } from "../../../application/context/SimuladorProvider";
import { BsMapFill, BsCheckCircleFill, BsArrowRepeat, BsStarFill } from "react-icons/bs";

interface MissionObject {
  id: string;
  type: "target" | "obstacle" | "waypoint" | "collectible" | "start";
  x: number;
  z: number;
  label?: string;
  completed?: boolean;
}

export const MissionCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    selectedActivity,
    isFreeMode,
    engineRef,
    missions,
    currentMissionIndex,
  } = useSimulador();
  const [loading] = useState(false);
  const currentMission = missions[currentMissionIndex];

  const [missionObjects, setMissionObjects] = useState<MissionObject[]>([]);

  useEffect(() => {
    if (!currentMission) {
      setMissionObjects([]);
      return;
    }

    const objects: MissionObject[] = [
      {
        id: "start",
        type: "start",
        x: 0,
        z: 0,
        label: "Inicio",
      },
    ];

    const missionIndex = currentMissionIndex;
    const totalMissions = missions.length;

    for (let i = 0; i <= missionIndex; i++) {
      const angle = (i / totalMissions) * Math.PI * 2;
      const radius = 80 + (i % 2) * 30;

      objects.push({
        id: `waypoint-${i}`,
        type: "waypoint",
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        label: `Punto ${i + 1}`,
        completed: i < missionIndex,
      });
    }

    const targetAngle = (missionIndex / totalMissions) * Math.PI * 2;
    const targetRadius = 80 + (missionIndex % 2) * 30;
    objects.push({
      id: "target",
      type: "target",
      x: Math.cos(targetAngle) * targetRadius,
      z: Math.sin(targetAngle) * targetRadius,
      label: currentMission.title,
    });

    if (missionIndex > 0) {
      for (let i = 0; i < missionIndex; i++) {
        const obstacleAngle = ((i + 0.5) / totalMissions) * Math.PI * 2;
        const obstacleRadius = 60 + (i % 3) * 20;
        objects.push({
          id: `obstacle-${i}`,
          type: "obstacle",
          x: Math.cos(obstacleAngle) * obstacleRadius,
          z: Math.sin(obstacleAngle) * obstacleRadius,
        });
      }
    }

    if (missionIndex >= 2) {
      const collectibleAngle = ((missionIndex - 1) / totalMissions) * Math.PI * 2;
      objects.push({
        id: "collectible",
        type: "collectible",
        x: Math.cos(collectibleAngle) * 50,
        z: Math.sin(collectibleAngle) * 50,
        label: "Recurso",
      });
    }

    setMissionObjects(objects);
  }, [currentMission, currentMissionIndex, missions.length]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resize();
    window.addEventListener("resize", resize);

    let animFrame: number;

    const render = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;
      const centerX = w / 2;
      const centerY = h / 2;

      ctx.strokeStyle = "rgba(100, 100, 120, 0.06)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x < w; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const time = Date.now() / 1000;

      missionObjects.forEach((obj) => {
        const ox = centerX + obj.x;
        const oy = centerY + obj.z;

        ctx.save();
        ctx.translate(ox, oy);

        switch (obj.type) {
          case "start":
            ctx.fillStyle = "#22c55e";
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "rgba(34, 197, 94, 0.3)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 12 + Math.sin(time * 2) * 2, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = "#fff";
            ctx.font = "bold 8px monospace";
            ctx.textAlign = "center";
            ctx.fillText("I", 0, 3);
            break;

          case "target":
            const targetPulse = Math.sin(time * 3) * 0.2 + 0.8;
            ctx.fillStyle = `rgba(239, 68, 68, ${targetPulse})`;
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 16 + Math.sin(time * 4) * 3, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = "#fff";
            ctx.font = "bold 8px monospace";
            ctx.textAlign = "center";
            ctx.fillText("F", 0, 3);

            if (obj.label) {
              ctx.fillStyle = "rgba(239, 68, 68, 0.8)";
              ctx.font = "9px monospace";
              ctx.fillText(obj.label, 0, 24);
            }
            break;

          case "waypoint":
            ctx.fillStyle = obj.completed ? "#22c55e" : "#3b82f6";
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.fill();

            if (!obj.completed) {
              ctx.strokeStyle = "rgba(59, 130, 246, 0.3)";
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.arc(0, 0, 10 + Math.sin(time * 2 + obj.x) * 2, 0, Math.PI * 2);
              ctx.stroke();
            }
            break;

          case "obstacle":
            ctx.fillStyle = "rgba(234, 179, 8, 0.6)";
            ctx.beginPath();
            ctx.moveTo(0, -8);
            ctx.lineTo(7, 4);
            ctx.lineTo(-7, 4);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = "rgba(234, 179, 8, 0.8)";
            ctx.lineWidth = 1;
            ctx.stroke();
            break;

          case "collectible":
            const collectPulse = Math.sin(time * 4 + obj.x) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(168, 85, 247, ${collectPulse})`;
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "rgba(168, 85, 247, 0.4)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.stroke();
            break;
        }

        ctx.restore();
      });

      missionObjects.forEach((obj, i) => {
        if (obj.type === "waypoint" || obj.type === "target") {
          const nextObj = missionObjects.find(
            (o, j) => j > i && (o.type === "waypoint" || o.type === "target")
          );
          if (nextObj) {
            const startX = centerX + obj.x;
            const startY = centerY + obj.z;
            const endX = centerX + nextObj.x;
            const endY = centerY + nextObj.z;

            ctx.strokeStyle = obj.completed
              ? "rgba(34, 197, 94, 0.4)"
              : "rgba(59, 130, 246, 0.2)";
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      });

      const engine = engineRef.current;
      if (engine && engine.getState) {
        const state = engine.getState();
        if (state) {
          const sx = (state.x as number) || 0;
          const sy = (state.y as number) || 0;
          const cx = centerX + sx * 2;
          const cy = centerY - sy * 2;

          ctx.save();
          ctx.translate(cx, cy);

          ctx.fillStyle = "#00f5d4";
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "rgba(0, 245, 212, 0.3)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2);
          ctx.stroke();

          const angle = (state.angle as number) || 0;
          ctx.rotate(-((angle * Math.PI) / 180));
          ctx.fillStyle = "#00f5d4";
          ctx.beginPath();
          ctx.moveTo(12, 0);
          ctx.lineTo(3, -5);
          ctx.lineTo(3, 5);
          ctx.closePath();
          ctx.fill();

          ctx.restore();
        }
      }

      animFrame = requestAnimationFrame(render);
    };

    animFrame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resize);
    };
  }, [engineRef, missionObjects]);

  if (!selectedActivity && isFreeMode) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full font-mono"
        style={{ color: "var(--text-muted)" }}
      >
        <BsMapFill className="text-3xl mb-2 opacity-40" />
        <span className="text-[10px] uppercase tracking-widest">
          Selecciona un reto para explorar
        </span>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full font-mono"
        style={{ color: "var(--text-muted)" }}
      >
        <BsArrowRepeat className="text-2xl mb-2 animate-spin" />
        <span className="text-[10px] uppercase tracking-widest">
          Cargando mapa...
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div
        className="absolute top-2 left-2 z-10 flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-md"
        style={{ backgroundColor: "rgba(0,0,0,0.7)", color: "var(--text-muted)" }}
      >
        <BsCheckCircleFill className="text-[10px] text-success" />
        {currentMission?.title || selectedActivity?.name || "Misión"}
        {currentMission && (
          <span className="text-primary ml-2">
            {currentMissionIndex + 1}/{missions.length}
          </span>
        )}
      </div>

      {currentMission && (
        <div
          className="absolute bottom-2 left-2 right-2 z-10 font-mono text-[9px] px-3 py-2 rounded-md"
          style={{ backgroundColor: "rgba(0,0,0,0.7)", color: "var(--text-muted)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <BsStarFill className="text-[10px] text-accent" />
            <span className="text-text font-semibold">Objetivo:</span>
          </div>
          <div className="text-text/80">{currentMission.objective}</div>
          {currentMission.maxBlocks > 0 && (
            <div className="text-primary/60 mt-1">
              Máximo {currentMission.maxBlocks} bloques
            </div>
          )}
        </div>
      )}

      <div
        className="absolute top-2 right-2 z-10 flex flex-col gap-1 font-mono text-[8px]"
        style={{ backgroundColor: "rgba(0,0,0,0.6)", borderRadius: "var(--theme-radius)" }}
      >
        <div className="flex items-center gap-1 px-2 py-1">
          <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
          <span className="text-text-muted">Inicio</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1">
          <div className="w-2 h-2 rounded-full bg-[#3b82f6]" />
          <span className="text-text-muted">Punto</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1">
          <div className="w-2 h-2 rounded-full bg-[#ef4444]" />
          <span className="text-text-muted">Meta</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1">
          <div className="w-2 h-2 rounded-full bg-[#eab308]" />
          <span className="text-text-muted">Obstáculo</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1">
          <div className="w-2 h-2 rounded-full bg-[#a855f7]" />
          <span className="text-text-muted">Recurso</span>
        </div>
      </div>

      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
