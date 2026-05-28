import { useSimulador } from "../../../application/context/SimuladorProvider";

const HARDWARE_CATALOG = [
  {
    id: "Tracción Oruga",
    name: "Tracción Oruga",
    icon: "settings_motion_mode",
    color: "var(--success)",
    bgClass: "bg-success/20",
    textClass: "text-success",
    borderClass: "border-success/30",
    desc: "Módulo de movimiento terrestre.",
    blocks: "[MOVER], [ROTAR]",
  },
  {
    id: "Hélices Cuádruples",
    name: "Hélices Drone",
    icon: "flight",
    color: "var(--primary)",
    bgClass: "bg-primary/20",
    textClass: "text-primary",
    borderClass: "border-primary/30",
    desc: "Módulo de propulsión aérea.",
    blocks: "[ELEVARSE], [ATERRIZAR]",
  },
  {
    id: "Brazo Robótico",
    name: "Garra Mecánica",
    icon: "precision_manufacturing",
    color: "var(--accent)",
    bgClass: "bg-accent/20",
    textClass: "text-accent",
    borderClass: "border-accent/30",
    desc: "Módulo de manipulación.",
    blocks: "[AGARRAR], [SOLTAR]",
  },
  {
    id: "Sensor Ultrasónico",
    name: "Radar Ultrasónico",
    icon: "radar",
    color: "var(--primary)",
    bgClass: "bg-primary/20",
    textClass: "text-primary",
    borderClass: "border-primary/30",
    desc: "Sensor de entorno y telemetría.",
    blocks: "[SI_DISTANCIA]",
  },
  {
    id: "Faro LED",
    name: "Proyector LED",
    icon: "highlight",
    color: "var(--accent)",
    bgClass: "bg-accent/20",
    textClass: "text-accent",
    borderClass: "border-accent/30",
    desc: "Módulo emisor de luz.",
    blocks: "[ENCENDER_LUZ]",
  },
];

export const HardwarePanel = () => {
  const { installedHardware, installHardware, uninstallHardware } =
    useSimulador();

  return (
    <div className="bg-surface border-l border-border flex flex-col h-full overflow-hidden rounded-lg">
      <div className="p-4 border-b border-border bg-surface-brighter sticky top-0 rounded-t-lg">
        <h3 className="font-mono text-text-muted text-xs tracking-[0.15em] uppercase mb-1">
          Puerto de Ensamblaje
        </h3>
        <p className="text-text-muted/60 text-[10px]">
          Instala módulos para desbloquear subrutinas.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="grid gap-3">
          {HARDWARE_CATALOG.map((hw) => {
            const isInstalled = installedHardware.includes(hw.id);

            return (
              <div
                key={hw.id}
                className={`p-3 border transition-all duration-300 rounded-lg ${
                  isInstalled
                    ? `${hw.borderClass} bg-surface-brighter`
                    : "border-border bg-surface hover:border-text-muted/30"
                } flex items-center justify-between group`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 flex items-center justify-center transition-colors rounded-lg ${
                      isInstalled
                        ? `${hw.bgClass} text-bg`
                        : "bg-surface-brighter text-text-muted group-hover:text-text"
                    } font-mono font-bold text-lg`}
                  >
                    <span className="material-symbols-outlined">{hw.icon}</span>
                  </div>
                  <div>
                    <span
                      className={`font-bold text-xs ${
                        isInstalled ? hw.textClass : "text-text-muted"
                      } transition-colors`}
                    >
                      {hw.name}
                    </span>
                    <p className="text-[10px] text-text-muted/50 font-mono mt-0.5">
                      {hw.blocks}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    isInstalled
                      ? uninstallHardware(hw.id)
                      : installHardware(hw.id)
                  }
                  className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors border rounded ${
                    isInstalled
                      ? "bg-danger/10 text-danger hover:bg-danger/20 border-danger/30"
                      : `bg-transparent text-text-muted hover:${hw.textClass} border-border hover:${hw.borderClass}`
                  }`}
                >
                  {isInstalled ? "Quitar" : "Instalar"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
