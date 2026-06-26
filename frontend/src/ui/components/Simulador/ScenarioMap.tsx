import { ENVIRONMENT_CONFIGS } from "../../../shared/constants/environmentConfigs";
import type { EnvironmentType } from "../../../shared/types/Simulador";
import type { StageLayout } from "../../../application/adapters/StageGenerator";
import { generateStage } from "../../../application/adapters/StageGenerator";

interface ScenarioMapProps {
  environment: EnvironmentType;
  startingPosition?: { x: number; z: number };
  targetPosition?: { x: number; z: number };
  obstacles?: { x: number; z: number; width: number; depth: number }[];
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  missionIndex?: number;
  totalMissions?: number;
}

export const ScenarioMap = ({
  environment,
  startingPosition,
  targetPosition,
  difficulty = "EASY",
  missionIndex = 0,
  totalMissions = 5,
}: ScenarioMapProps) => {
  const config = ENVIRONMENT_CONFIGS[environment];
  const stage: StageLayout = generateStage(environment, difficulty, totalMissions, missionIndex);

  const scale = 6;
  const w = 400;
  const h = 300;
  const ox = w / 2;
  const oy = h / 2;

  const toScreen = (x: number, z: number) => ({
    x: ox + x * scale,
    y: oy - z * scale,
  });

  const envTheme = config?.theme || { primary: "#3b82f6", secondary: "#8b5cf6", accent: "#06b6d4", background: "#0f172a" };

  return (
    <div
      className="bg-surface border border-border p-4"
      style={{ borderRadius: "var(--theme-radius)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] uppercase font-bold tracking-widest" style={{ color: "var(--text-muted)" }}>
          Escenario: {config?.name || environment}
        </h3>
        <span
          className="text-[8px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${envTheme.primary}20`, color: envTheme.primary }}
        >
          {stage.pattern} · Nvl {missionIndex + 1}
        </span>
      </div>

      <div
        className="relative w-full border border-border overflow-hidden"
        style={{ borderRadius: "var(--theme-radius)", aspectRatio: `${w}/${h}` }}
      >
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" style={{ backgroundColor: envTheme.background }}>
          {stage.cells.map((cell, i) => {
            if (cell.type === "empty" || cell.type === "wall") return null;
            const pos = toScreen(cell.x, cell.z);
            const pulse = Math.sin(Date.now() / 500 + i) * 0.15 + 0.85;

            switch (cell.type) {
              case "start":
                return (
                  <g key={i}>
                    <circle cx={pos.x} cy={pos.y} r={8} fill="#22c55e" opacity={0.3} />
                    <circle cx={pos.x} cy={pos.y} r={4} fill="#22c55e" />
                    <text x={pos.x + 10} y={pos.y + 4} fill="var(--text-muted)" fontSize={8}>Inicio</text>
                  </g>
                );
              case "target": {
                return (
                  <g key={i}>
                    <circle cx={pos.x} cy={pos.y} r={8} fill="#ef4444" opacity={pulse * 0.3} />
                    <rect x={pos.x - 4} y={pos.y - 4} width={8} height={8} fill="#ef4444" transform={`rotate(45, ${pos.x}, ${pos.y})`} />
                    <text x={pos.x + 10} y={pos.y + 4} fill="var(--text-muted)" fontSize={8}>Objetivo</text>
                  </g>
                );
              }
              case "waypoint":
                return (
                  <g key={i}>
                    <circle cx={pos.x} cy={pos.y} r={4} fill="#3b82f6" opacity={0.6} />
                    {cell.label && (
                      <text x={pos.x + 8} y={pos.y + 3} fill="var(--text-muted)" fontSize={6}>{cell.label}</text>
                    )}
                  </g>
                );
              case "collectible":
                return (
                  <g key={i}>
                    <circle cx={pos.x} cy={pos.y} r={3} fill="#a855f7" opacity={pulse} />
                  </g>
                );
              case "obstacle":
                return (
                  <g key={i}>
                    <polygon points={`${pos.x},${pos.y - 5} ${pos.x + 5},${pos.y + 4} ${pos.x - 5},${pos.y + 4}`} fill="#eab308" opacity={0.6} />
                  </g>
                );
              default:
                return null;
            }
          })}

          {stage.waypoints.length > 1 && (
            <path
              d={stage.waypoints.map((wp, i) => {
                const p = toScreen(wp.x, wp.z);
                return `${i === 0 ? "M" : "L"}${p.x},${p.y}`;
              }).join(" ")}
              fill="none"
              stroke="rgba(59,130,246,0.2)"
              strokeWidth={1}
              strokeDasharray="4,4"
            />
          )}

          {startingPosition && targetPosition && (
            <>
              <line
                x1={toScreen(startingPosition.x, startingPosition.z).x}
                y1={toScreen(startingPosition.x, startingPosition.z).y}
                x2={toScreen(targetPosition.x, targetPosition.z).x}
                y2={toScreen(targetPosition.x, targetPosition.z).y}
                stroke="var(--border)"
                strokeWidth={0.5}
                strokeDasharray="2,2"
              />
            </>
          )}
        </svg>
      </div>

      <div className="flex items-center gap-3 mt-2 text-[7px] font-mono" style={{ color: "var(--text-muted)" }}>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#22c55e]" /> Inicio
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#3b82f6]" /> Waypoint
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-[#ef4444]" style={{ transform: "rotate(45deg)" }} /> Meta
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#a855f7]" /> Recurso
        </span>
        <span className="ml-auto" style={{ color: "var(--primary)" }}>
          {stage.iterationHint}
        </span>
      </div>
    </div>
  );
};
