const bits = [
  [2, 3],
  [1, 2, 3, 4],
  [0, 1, 3, 4, 6, 7],
  [0, 1, 3, 4, 6, 7],
  [0, 1, 3, 4, 5, 7, 8],
  [0, 1, 3, 4, 5, 7, 8],
  [0, 1, 2, 3, 4, 5, 6, 7],
  [1, 2, 3, 4, 5, 6],
  [1, 2, 5, 6],
  [1, 2, 5, 6],
];

export const RobotIcon = ({ size = 16, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 10 11" fill="none" stroke="currentColor" strokeWidth="0.1" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className ?? ""}`}>
    {bits.map((row, ri) =>
      row.map((col) => (
        <rect
          key={`${ri}-${col}`}
          x={col}
          y={ri}
          width={1}
          height={1}
          rx={0}
        />
      ))
    )}
  </svg>
);
