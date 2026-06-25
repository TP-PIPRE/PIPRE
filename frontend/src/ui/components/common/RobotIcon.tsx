export const RobotIcon = ({ size = 16, className }: { size?: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 180 180"
    width={size}
    height={size}
    className={`shrink-0 ${className ?? ""}`}
    style={{ "--c1": "var(--robot-c1, #6CB6FF)", "--c2": "var(--robot-c2, #D26BFF)" } as React.CSSProperties}
  >
    <defs>
      <linearGradient id="robotGradient" x1="0%" y1="100%" x2="100%" y2="0%">
        <animate attributeName="x1" values="0%;30%;0%" dur="6s" repeatCount="indefinite" />
        <animate attributeName="y1" values="100%;70%;100%" dur="6s" repeatCount="indefinite" />
        <animate attributeName="x2" values="100%;70%;100%" dur="6s" repeatCount="indefinite" />
        <animate attributeName="y2" values="0%;30%;0%" dur="6s" repeatCount="indefinite" />
        <stop offset="0%" stopColor="var(--c1)" />
        <stop offset="100%" stopColor="var(--c2)" />
      </linearGradient>
      <filter id="robotGlow">
        <feGaussianBlur stdDeviation="4" result="blur">
          <animate attributeName="stdDeviation" values="3;6;3" dur="3s" repeatCount="indefinite" />
        </feGaussianBlur>
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g
      fill="url(#robotGradient)"
      filter="url(#robotGlow)"
      stroke="currentColor"
      strokeOpacity="0.12"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="82" y="10" width="16" height="16" rx="3" />
      <rect x="64" y="28" width="16" height="16" rx="3" />
      <rect x="82" y="28" width="16" height="16" rx="3" />
      <rect x="100" y="28" width="16" height="16" rx="3" />
      <rect x="64" y="46" width="16" height="16" rx="3" />
      <rect x="82" y="46" width="16" height="16" rx="3" />
      <rect x="100" y="46" width="16" height="16" rx="3" />
      <rect x="46" y="64" width="16" height="16" rx="3" />
      <rect x="64" y="64" width="16" height="16" rx="3" />
      <rect x="82" y="64" width="16" height="16" rx="3" />
      <rect x="100" y="64" width="16" height="16" rx="3" />
      <rect x="118" y="64" width="16" height="16" rx="3" />
      <rect x="64" y="84" width="16" height="16" rx="3" />
      <rect x="82" y="84" width="16" height="16" rx="3" />
      <rect x="100" y="84" width="16" height="16" rx="3" />
      <rect x="18" y="82" width="16" height="16" rx="3" />
      <rect x="36" y="82" width="16" height="16" rx="3" />
      <rect x="18" y="100" width="16" height="16" rx="3" />
      <rect x="36" y="100" width="16" height="16" rx="3" />
      <rect x="128" y="82" width="16" height="16" rx="3" />
      <rect x="146" y="82" width="16" height="16" rx="3" />
      <rect x="128" y="100" width="16" height="16" rx="3" />
      <rect x="146" y="100" width="16" height="16" rx="3" />
    </g>
  </svg>
);
