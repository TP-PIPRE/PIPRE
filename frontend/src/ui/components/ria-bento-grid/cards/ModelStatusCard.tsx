interface Props {
  health: Record<string, unknown> | null;
}

export const ModelStatusCard = ({ health }: Props) => {
  const status = health?.status as string | undefined;
  const isHealthy = status === "healthy" || status === "ok";

  return (
    <div className="h-full border border-border bg-surface rounded-xl px-6 py-5 transition-all duration-300 hover:shadow-lg" style={{ backgroundColor: "var(--surface)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isHealthy ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>API de IA</span>
        </div>
        <span className="text-xs font-mono font-bold" style={{ color: isHealthy ? "#22c55e" : "#ef4444" }}>
          {isHealthy ? "● Operativo" : "● No disponible"}
        </span>
      </div>
      {health ? (
        <div className="flex items-center gap-6 text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
          {typeof health.model === "string" && (
            <span>Modelo: <span className="font-bold" style={{ color: "var(--text)" }}>{health.model as string}</span></span>
          )}
          {typeof health.version === "string" && (
            <span>Versión: <span className="font-bold" style={{ color: "var(--text)" }}>v{health.version as string}</span></span>
          )}
          {typeof health.uptime === "number" && (
            <span>Uptime: <span className="font-bold" style={{ color: "var(--text)" }}>{(health.uptime as number).toFixed(0)}s</span></span>
          )}
          {!health.model && !health.version && typeof health.uptime !== "number" && (
            <span>Servicio disponible</span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
          <div className="w-3 h-3 border-2 border-text-muted border-t-transparent rounded-full animate-spin" />
          <span>Verificando conexión...</span>
        </div>
      )}
    </div>
  );
};
