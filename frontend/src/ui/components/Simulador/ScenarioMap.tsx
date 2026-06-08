interface ScenarioMapProps {
  environment: string;
  startingPosition?: { x: number; z: number };
  targetPosition?: { x: number; z: number };
  obstacles?: { x: number; z: number; width: number; depth: number }[];
}

const envLabels: Record<string, string> = {
  obstacle: "Campo de Obstáculos",
  maze: "Laberinto",
  open: "Terreno Abierto",
  grid: "Cuadrícula",
};

export const ScenarioMap = ({
  environment,
  startingPosition,
  targetPosition,
}: ScenarioMapProps) => {
  const scale = 6;
  const w = 400;
  const h = 300;
  const ox = w / 2;
  const oy = h / 2;

  const toScreen = (x: number, z: number) => ({
    x: ox + x * scale,
    y: oy - z * scale,
  });

  return (
    <div
      className="bg-surface border border-border p-4"
      style={{ borderRadius: "var(--theme-radius)" }}
    >
      <h3 className="text-[10px] uppercase font-bold tracking-widest text-text-muted mb-3">
        Escenario: {envLabels[environment] ?? environment}
      </h3>

      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full bg-bg border border-border"
        style={{ borderRadius: "var(--theme-radius)", aspectRatio: `${w}/${h}` }}
      >
        {/* Grid */}
        {Array.from({ length: 10 }).map((_, i) => (
          <g key={i}>
            <line
              x1={0}
              y1={(h / 10) * i}
              x2={w}
              y2={(h / 10) * i}
              stroke="var(--border)"
              strokeWidth={0.5}
            />
            <line
              x1={(w / 10) * i}
              y1={0}
              x2={(w / 10) * i}
              y2={h}
              stroke="var(--border)"
              strokeWidth={0.5}
            />
          </g>
        ))}

        {/* Starting position */}
        {startingPosition && (() => {
          const s = toScreen(startingPosition.x, startingPosition.z);
          return (
            <g>
              <circle
                cx={s.x}
                cy={s.y}
                r={8}
                fill="var(--success)"
                opacity={0.3}
              />
              <circle
                cx={s.x}
                cy={s.y}
                r={4}
                fill="var(--success)"
              />
              <text
                x={s.x + 10}
                y={s.y + 4}
                fill="var(--text-muted)"
                fontSize={8}
              >
                Inicio
              </text>
            </g>
          );
        })()}

        {/* Target position */}
        {targetPosition && (() => {
          const t = toScreen(targetPosition.x, targetPosition.z);
          return (
            <g>
              <circle
                cx={t.x}
                cy={t.y}
                r={8}
                fill="var(--danger)"
                opacity={0.3}
              />
              <rect
                x={t.x - 4}
                y={t.y - 4}
                width={8}
                height={8}
                fill="var(--danger)"
                transform={`rotate(45, ${t.x}, ${t.y})`}
              />
              <text
                x={t.x + 10}
                y={t.y + 4}
                fill="var(--text-muted)"
                fontSize={8}
              >
                Objetivo
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
};
