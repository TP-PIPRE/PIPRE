import { useState } from "react";
import { useSimulador } from "../../../application/context/SimuladorProvider";
import { ENVIRONMENT_CONFIGS } from "../../../shared/constants/environmentConfigs";
import type { HardwareDefinition } from "../../../shared/types/Simulador";

export const HardwarePanel = () => {
  const { environment, portAssignments, assignHardware, clearPort } =
    useSimulador();

  const config = ENVIRONMENT_CONFIGS[environment];
  const [openSlot, setOpenSlot] = useState<string | null>(null);

  if (!config || config.hardware.length === 0) {
    return (
      <div className="bg-surface border-l border-border flex flex-col h-full overflow-hidden rounded-lg">
        <div className="p-4 border-b border-border bg-surface-brighter sticky top-0 rounded-t-lg">
          <h3 className="font-mono text-text-muted text-xs tracking-[0.15em] uppercase mb-1">
            Puerto de Ensamblaje
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="font-mono text-[10px] text-text-muted/50">
            No hay hardware disponible para este entorno.
          </p>
        </div>
      </div>
    );
  }

  const assignedHwIds = Object.values(portAssignments).filter(Boolean);

  const isHardwareAvailable = (hwId: string): boolean =>
    !assignedHwIds.includes(hwId);

  const getHwById = (id: string): HardwareDefinition | undefined =>
    config.hardware.find((h) => h.id === id);

  return (
    <div className="bg-surface border-l border-border flex flex-col h-full overflow-hidden rounded-lg">
      <div className="p-4 border-b border-border bg-surface-brighter sticky top-0 rounded-t-lg">
        <h3 className="font-mono text-text-muted text-xs tracking-[0.15em] uppercase mb-1">
          Puerto de Ensamblaje
        </h3>
        <p className="text-text-muted/60 text-[10px]">
          {config.name} — Asigna hardware a cada ranura
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
        {config.portSlots.map((slot) => {
          const installedHwId = portAssignments[slot.id];
          const installedHw = installedHwId ? getHwById(installedHwId) : null;

          return (
            <div
              key={slot.id}
              className={`border transition-all duration-300 rounded-lg overflow-hidden ${
                installedHw
                  ? `${installedHw.borderClass} bg-surface-brighter`
                  : "border-border bg-surface"
              }`}
            >
              {/* Slot header */}
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 flex items-center justify-center transition-colors rounded-lg ${
                      installedHw
                        ? `${installedHw.bgClass} text-bg`
                        : "bg-surface-brighter text-text-muted"
                    } font-mono font-bold text-lg`}
                  >
                    <span className="material-symbols-outlined">
                      {slot.icon}
                    </span>
                  </div>
                  <div>
                    <span
                      className={`font-bold text-xs ${
                        installedHw ? installedHw.textClass : "text-text-muted"
                      } transition-colors`}
                    >
                      {slot.name}
                    </span>
                    <p className="text-[9px] text-text-muted/40 font-mono mt-0.5">
                      {installedHw ? installedHw.name : "Vacío"}
                    </p>
                  </div>
                </div>

                {installedHw ? (
                  <button
                    onClick={() => {
                      clearPort(slot.id);
                      setOpenSlot(null);
                    }}
                    className="px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors border rounded bg-danger/10 text-danger hover:bg-danger/20 border-danger/30"
                  >
                    Quitar
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      setOpenSlot(openSlot === slot.id ? null : slot.id)
                    }
                    className="px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors border rounded bg-transparent text-text-muted hover:text-text border-border hover:border-text-muted/30"
                  >
                    {openSlot === slot.id ? "Cerrar" : "Seleccionar"}
                  </button>
                )}
              </div>

              {/* Dropdown — compatible hardware picker */}
              {!installedHw && openSlot === slot.id && (
                <div className="border-t border-border px-3 py-2 space-y-1">
                  <p className="text-[9px] text-text-muted/50 font-mono mb-2">
                    Hardware compatible:
                  </p>
                  {slot.accepts.length === 0 ? (
                    <p className="text-[9px] text-text-muted/30 font-mono italic">
                      No acepta hardware
                    </p>
                  ) : (
                    slot.accepts.map((hwId) => {
                      const hw = getHwById(hwId);
                      if (!hw) return null;
                      const taken = !isHardwareAvailable(hwId);
                      return (
                        <button
                          key={hwId}
                          disabled={taken}
                          onClick={() => {
                            assignHardware(slot.id, hwId);
                            setOpenSlot(null);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[10px] font-mono transition-colors border ${
                            taken
                              ? "opacity-40 cursor-not-allowed border-border"
                              : "border-border hover:border-primary/40 hover:bg-surface-brighter cursor-pointer"
                          }`}
                        >
                          <span
                            className={`w-6 h-6 flex items-center justify-center rounded ${hw.bgClass}`}
                          >
                            <span className="material-symbols-outlined text-[12px]">
                              {hw.icon}
                            </span>
                          </span>
                          <span className="flex-1 text-left text-text">
                            {hw.name}
                          </span>
                          {taken && (
                            <span className="text-[8px] text-text-muted/50 uppercase tracking-wider">
                              — en uso
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {/* Installed hardware description */}
              {installedHw && (
                <div className="border-t border-border px-3 py-2">
                  <p className="text-[9px] text-text-muted/50 font-mono">
                    {installedHw.desc}
                  </p>
                  <p className="text-[9px] text-accent font-mono mt-0.5">
                    {installedHw.blocks}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
