import {
  ArrowRight,
  Cable,
  CircleDot,
  Cpu,
  ShieldAlert,
  Wrench,
  Zap,
} from "lucide-react";

type ConnectionKind =
  | "power"
  | "ground"
  | "signal"
  | "communication"
  | "protection"
  | "mechanical";

interface WiringConnection {
  source: string;
  target: string;
  kind: ConnectionKind;
}

const KIND_META: Record<
  ConnectionKind,
  { label: string; color: string; Icon: typeof Zap }
> = {
  power: { label: "Alimentación", color: "#ef4444", Icon: Zap },
  ground: { label: "Tierra / retorno", color: "#64748b", Icon: CircleDot },
  signal: { label: "Señal de control", color: "#eab308", Icon: Cpu },
  communication: { label: "Comunicación", color: "#06b6d4", Icon: Cable },
  protection: { label: "Protección", color: "#f97316", Icon: ShieldAlert },
  mechanical: { label: "Unión mecánica", color: "#8b5cf6", Icon: Wrench },
};

const classifyConnection = (text: string): ConnectionKind => {
  const value = text.toLowerCase();

  if (/(diodo|resistencia|divisor|shield|protecci[oó]n)/.test(value)) return "protection";
  if (/(acople|fijaci[oó]n|tornill|rodamiento|montaje|lubric|manguera|soporte|eje)/.test(value)) {
    return "mechanical";
  }
  if (/(gnd|tierra|retorno|neutro|\bpe\b)/.test(value)) return "ground";
  if (/(tx|rx|uart|can_|can h|can l|a\+|b-|bus|comunicaci[oó]n)/.test(value)) {
    return "communication";
  }
  if (/(vcc|vdd|vin|5v|3\.3v|7v|12v|24v|110|220|240|fuente|fase|bater[ií]a)/.test(value)) {
    return "power";
  }
  return "signal";
};

const parseWiring = (wiring: string): WiringConnection[] =>
  wiring
    .split(/\s*\|\s*/)
    .map((segment) => {
      const arrow = segment.match(/\s*(?:→|->)\s*/);
      if (arrow?.index !== undefined) {
        const splitAt = arrow.index;
        return {
          source: segment.slice(0, splitAt).trim(),
          target: segment.slice(splitAt + arrow[0].length).trim(),
          kind: classifyConnection(segment),
        };
      }

      const [source, ...detail] = segment.split(":");
      return {
        source: source.trim(),
        target: detail.join(":").trim() || "Revisar montaje y especificación",
        kind: "mechanical" as const,
      };
    })
    .filter((connection) => connection.source && connection.target);

const getWarnings = (wiring: string): string[] => {
  const warnings: string[] = [];
  const value = wiring.toLowerCase();

  if (/(fuente externa|alimentaci[oó]n externa)/.test(value)) {
    warnings.push("Usa una fuente externa para la potencia; no alimentes el motor desde el GPIO.");
  }
  if (/(gnd com[uú]n|tierra com[uú]n)/.test(value)) {
    warnings.push("Une las tierras de la fuente, el controlador y el driver para compartir referencia.");
  }
  if (/(nunca directo|no 5v directo|importante)/.test(value)) {
    warnings.push("Respeta el nivel de voltaje indicado antes de energizar el circuito.");
  }
  if (/(rel[eé]|mosfet|diodo flyback)/.test(value)) {
    warnings.push("El GPIO solo entrega la señal de mando; la carga requiere una etapa de potencia.");
  }

  return warnings;
};

export const WiringDiagram = ({
  componentName,
  wiring,
}: {
  componentName: string;
  wiring: string;
}) => {
  const connections = parseWiring(wiring);
  const warnings = getWarnings(wiring);
  const visibleKinds = [...new Set(connections.map((connection) => connection.kind))];

  return (
    <div className="overflow-hidden rounded-xl border border-border/30 bg-muted/10">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/20 px-4 py-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60">
            Esquema de terminales
          </p>
          <p className="mt-1 text-xs font-semibold text-foreground">{componentName}</p>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
          {visibleKinds.map((kind) => {
            const meta = KIND_META[kind];
            return (
              <span key={kind} className="flex items-center gap-1.5 text-[8px] font-medium text-muted-foreground">
                <span className="h-1.5 w-4 rounded-full" style={{ backgroundColor: meta.color }} />
                {meta.label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="px-3 py-4 sm:px-4">
        <div className="mb-2 grid grid-cols-[minmax(0,1fr)_48px_minmax(0,1.25fr)] items-end gap-2 px-1 text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground/45">
          <span>Terminal</span>
          <span className="text-center">Cable</span>
          <span>Destino</span>
        </div>

        <div className="space-y-2">
          {connections.map((connection, index) => {
            const meta = KIND_META[connection.kind];
            const Icon = meta.Icon;
            return (
              <div
                key={`${connection.source}-${connection.target}-${index}`}
                className="grid grid-cols-[minmax(0,1fr)_48px_minmax(0,1.25fr)] items-center gap-2"
              >
                <div className="flex min-h-11 items-center gap-2 rounded-lg border border-border/30 bg-background/70 px-3 py-2">
                  <span
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-md"
                    style={{ color: meta.color, backgroundColor: `${meta.color}18` }}
                  >
                    <Icon size={13} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 break-words font-mono text-[9px] font-bold text-foreground">
                    {connection.source}
                  </span>
                </div>

                <div className="relative flex items-center" aria-hidden="true">
                  <span className="h-0.5 flex-1 rounded-full" style={{ backgroundColor: meta.color }} />
                  <ArrowRight size={13} strokeWidth={2.5} style={{ color: meta.color }} />
                </div>

                <div className="min-h-11 rounded-lg border border-border/20 bg-muted/20 px-3 py-2">
                  <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: meta.color }}>
                    {meta.label}
                  </p>
                  <p className="mt-0.5 break-words text-[9px] font-medium leading-relaxed text-muted-foreground">
                    {connection.target}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="border-t border-border/20 bg-amber-500/5 px-4 py-3">
          {warnings.map((warning) => (
            <p key={warning} className="flex gap-2 text-[9px] leading-relaxed text-amber-600 dark:text-amber-300">
              <ShieldAlert size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{warning}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
};
