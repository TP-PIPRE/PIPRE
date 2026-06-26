import { useId, type CSSProperties } from "react";

interface RobotIconProps {
  size?: number;
  className?: string;
  label?: string;
}

export const RobotIcon = ({
  size = 32,
  className,
  label = "PIPRE",
}: RobotIconProps) => {
  const id = useId().replace(/:/g, "");
  const blockGradientId = `robot-block-gradient-${id}`;
  const wheelGradientId = `robot-wheel-gradient-${id}`;
  const auraGradientId = `robot-aura-gradient-${id}`;
  const glowId = `robot-pixel-glow-${id}`;
  const blocks = [
    [82, 40],
    [64, 58],
    [82, 58],
    [100, 58],
    [64, 76],
    [82, 76],
    [100, 76],
    [46, 94],
    [64, 94],
    [82, 94],
    [100, 94],
    [118, 94],
    [28, 112],
    [46, 112],
    [64, 112],
    [100, 112],
    [118, 112],
    [136, 112],
  ];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 180 180"
      width={size}
      height={size}
      className={`shrink-0 overflow-visible ${className ?? ""}`}
      style={
        {
          "--robot-a": "var(--robot-c1, #93c5fd)",
          "--robot-b": "var(--robot-c2, #c084fc)",
          "--robot-c": "var(--robot-c3, #a78bfa)",
          "--robot-shell": "oklch(16% 0.018 265)",
          "--robot-shell-raised": "oklch(20% 0.02 265)",
          "--robot-line": "oklch(92% 0.012 265)",
          "--robot-cut": "oklch(11% 0.014 265)",
        } as CSSProperties
      }
      role="img"
      aria-label={label}
    >
      <defs>
        <radialGradient id={auraGradientId} cx="50%" cy="58%" r="54%">
          <stop offset="0%" stopColor="var(--robot-c)" stopOpacity="0.28" />
          <stop offset="62%" stopColor="var(--robot-b)" stopOpacity="0.12" />
          <stop offset="100%" stopColor="var(--robot-a)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={blockGradientId} x1="18%" y1="92%" x2="84%" y2="8%">
          <stop offset="0%" stopColor="var(--robot-a)" />
          <stop offset="48%" stopColor="var(--robot-c)" />
          <stop offset="100%" stopColor="var(--robot-b)" />
        </linearGradient>
        <linearGradient id={wheelGradientId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--robot-a)" />
          <stop offset="100%" stopColor="var(--robot-b)" />
        </linearGradient>
        <filter id={glowId} x="-35%" y="-35%" width="170%" height="170%">
          <feGaussianBlur stdDeviation="2.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect
        x="7"
        y="7"
        width="166"
        height="166"
        rx="42"
        fill="var(--robot-shell)"
        stroke="var(--robot-line)"
        strokeOpacity="0.22"
        strokeWidth="4"
      />
      <rect
        x="15"
        y="15"
        width="150"
        height="150"
        rx="34"
        fill="var(--robot-shell-raised)"
        fillOpacity="0.28"
      />
      <circle cx="90" cy="96" r="68" fill={`url(#${auraGradientId})`} />

      <g filter={`url(#${glowId})`}>
        <g fill={`url(#${blockGradientId})`}>
          {blocks.map(([x, y]) => (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width="16"
              height="16"
              rx="4"
            />
          ))}
        </g>

        <g fill={`url(#${wheelGradientId})`}>
          <rect x="28" y="126" width="34" height="22" rx="6" />
          <rect x="118" y="126" width="34" height="22" rx="6" />
        </g>
      </g>

      <g stroke="var(--robot-cut)" strokeLinecap="round" strokeWidth="7">
        <path d="M45 130v14" />
        <path d="M38 137h14" />
        <path d="M135 130v14" />
        <path d="M128 137h14" />
      </g>
      <path
        d="M68 116h44"
        stroke="var(--robot-line)"
        strokeLinecap="round"
        strokeOpacity="0.28"
        strokeWidth="4"
      />
    </svg>
  );
};
