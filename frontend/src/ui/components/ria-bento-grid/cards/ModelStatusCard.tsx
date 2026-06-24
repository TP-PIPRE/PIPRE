interface Props {
  health: Record<string, unknown> | null;
}

export const ModelStatusCard = ({ health }: Props) => {
  const status = health?.status as string | undefined;
  const isHealthy = status === "healthy" || status === "ok";

  return (
    <div className="h-full border border-border bg-surface rounded-xl px-5 flex items-center gap-4 transition-all duration-300 hover:shadow-lg" style={{ backgroundColor: "var(--surface)", minHeight: 52 }}>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isHealthy ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
        <span className="text-[9px] font-mono font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>API de IA</span>
      </div>
      <span className="text-[9px] font-mono" style={{ color: isHealthy ? "#22c55e" : "#ef4444" }}>
        {isHealthy ? "Operativo" : "No disponible"}
      </span>
      {health && (
        <div className="flex items-center gap-3 ml-auto">
          {typeof health.version === "string" && (
            <span className="text-[8px] font-mono" style={{ color: "var(--text-muted)" }}>v{health.version}</span>
          )}
          {typeof health.uptime === "number" && (
            <span className="text-[8px] font-mono" style={{ color: "var(--text-muted)" }}>Uptime: {health.uptime}s</span>
          )}
        </div>
      )}
    </div>
  );
};
