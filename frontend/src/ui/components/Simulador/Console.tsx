import { useEffect, useRef, useState } from "react";
import { useSimulador } from "../../../application/context/SimuladorProvider";

type SeverityFilter = "all" | "info" | "success" | "warn" | "error";

const SEVERITY_CONFIG: Record<SeverityFilter, { label: string; color: string; dot: string }> = {
  all: { label: "Todo", color: "var(--text-muted)", dot: "bg-text-muted" },
  info: { label: "Info", color: "var(--text-muted)", dot: "bg-text-muted/60" },
  success: { label: "OK", color: "#22c55e", dot: "bg-[#22c55e]" },
  warn: { label: "!", color: "#eab308", dot: "bg-[#eab308]" },
  error: { label: "✗", color: "#ef4444", dot: "bg-[#ef4444]" },
};

export const Console = () => {
  const { logs, isRunning } = useSimulador();
  const [filter, setFilter] = useState<SeverityFilter>("all");
  const bottomRef = useRef<HTMLDivElement>(null);

  const filteredLogs = filter === "all" ? logs : logs.filter((l) => l.type === filter);

  useEffect(() => {
    if (filter !== "error") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [filteredLogs.length, filter]);

  const counts = {
    all: logs.length,
    info: logs.filter((l) => l.type === "info").length,
    success: logs.filter((l) => l.type === "success").length,
    warn: logs.filter((l) => l.type === "warn").length,
    error: logs.filter((l) => l.type === "error").length,
  };

  return (
    <div
      className="flex flex-col h-full font-mono text-[9px]"
      style={{ color: "var(--text)" }}
    >
      <div
        className="shrink-0 flex items-center justify-between px-3 py-1.5 border-b border-border"
        style={{ backgroundColor: "var(--surface-brighter)" }}
      >
        <span className="text-text-muted/60 uppercase tracking-widest text-[8px] font-bold">
          Consola
          {isRunning && (
            <span className="ml-2 text-primary animate-pulse">● Ejecutando</span>
          )}
        </span>
        <div className="flex items-center gap-1">
          {(Object.keys(SEVERITY_CONFIG) as SeverityFilter[]).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-all ${
                filter === key ? "opacity-100" : "opacity-50 hover:opacity-80"
              }`}
              style={{
                backgroundColor: filter === key ? `${SEVERITY_CONFIG[key].color}15` : "transparent",
              }}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${SEVERITY_CONFIG[key].dot}`} />
              <span className="text-[8px] text-text-muted">{SEVERITY_CONFIG[key].label}</span>
              {counts[key] > 0 && (
                <span
                  className="text-[7px] px-1 rounded-full"
                  style={{
                    backgroundColor: filter === key ? `${SEVERITY_CONFIG[key].color}25` : "var(--bg)",
                    color: SEVERITY_CONFIG[key].color,
                  }}
                >
                  {counts[key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-muted/40 text-[8px]">
            {logs.length === 0 ? "Esperando eventos..." : "Sin resultados para este filtro"}
          </div>
        ) : (
          filteredLogs.map((log, i) => (
            <div
              key={i}
              className="flex items-start gap-2 px-1.5 py-0.5 rounded hover:bg-surface-brighter/50 transition-colors group"
            >
              <span className="w-2 h-2 rounded-full mt-0.5 shrink-0" style={{
                backgroundColor: log.type === "error" ? "#ef4444" :
                  log.type === "success" ? "#22c55e" :
                  log.type === "warn" ? "#eab308" :
                  "var(--text-muted)",
                opacity: 0.7,
              }} />
              <span className="text-text-muted/50 shrink-0 group-hover:opacity-100 opacity-0 transition-opacity w-14">
                {log.time}
              </span>
              <span className={`${
                log.type === "error" ? "text-[#ef4444]" :
                log.type === "success" ? "text-[#22c55e]" :
                log.type === "warn" ? "text-[#eab308]" :
                "text-text-muted/80"
              }`}>
                {log.msg}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
