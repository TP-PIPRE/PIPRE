import { useEffect, useRef } from "react";
import { useSimulador } from "../../../application/context/SimuladorProvider";

export const Console = () => {
  const { logs } = useSimulador();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const getColor = (type: string) => {
    switch (type) {
      case "error":
        return "text-danger";
      case "success":
        return "text-success";
      case "warn":
        return "text-yellow-400";
      default:
        return "text-text-muted/80";
    }
  };

  return (
    <div
      className="bg-surface border border-border flex flex-col h-full font-mono text-xs rounded-lg"
      style={{ color: "var(--text)" }}
    >
      <div
        className="p-3 border-b border-border flex justify-between items-center rounded-t-lg"
        style={{ backgroundColor: "var(--surface-brighter)" }}
      >
        <span className="text-text-muted uppercase tracking-widest text-[10px] font-bold">
          Terminal de Datos
        </span>
        <div className="flex gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "var(--border)" }}
          ></div>
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "var(--border)" }}
          ></div>
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "var(--border)" }}
          ></div>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-1.5">
        {logs.length === 0 ? (
          <div className="text-text-muted/60 opacity-80">
            Esperando eventos de sistema...
          </div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-text-muted/80 shrink-0">{log.time}</span>
              <span className={`${getColor(log.type)}`}>{log.msg}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
