import { useSimulador } from "../../../application/context/SimuladorProvider";
import { ENVIRONMENT_CONFIGS } from "../../../shared/constants/environmentConfigs";
import { BsRobot } from "react-icons/bs";

export const RobotPreview = () => {
  const { environment, portAssignments } = useSimulador();
  const config = ENVIRONMENT_CONFIGS[environment];
  if (!config) return null;

  const assignedHwIds = Object.values(portAssignments).filter(Boolean);
  const hasHardware = assignedHwIds.length > 0;

  return (
    <div
      className="flex flex-col items-center justify-center p-1.5 border-b"
      style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="relative">
        <svg width="48" height="48" viewBox="0 0 80 80">
          <rect x="20" y="25" width="40" height="30" rx="6" fill="var(--primary)" opacity="0.8" />
          <circle cx="40" cy="18" r="10" fill="var(--surface-brighter)" stroke="var(--primary)" strokeWidth="2" />
          <circle cx="36" cy="16" r="2" fill="var(--primary)" />
          <circle cx="44" cy="16" r="2" fill="var(--primary)" />
          <line x1="40" y1="8" x2="40" y2="2" stroke="var(--primary)" strokeWidth="1.5" />
          <circle cx="40" cy="2" r="2" fill="var(--warning)" />
          <rect x="18" y="52" width="12" height="6" rx="3" fill="var(--text-muted)" opacity="0.6" />
          <rect x="50" y="52" width="12" height="6" rx="3" fill="var(--text-muted)" opacity="0.6" />
          <rect x="8" y="30" width="10" height="6" rx="2" fill={portAssignments["slot_left"] ? "var(--success)" : "var(--border)"} />
          <rect x="62" y="30" width="10" height="6" rx="2" fill={portAssignments["slot_right"] ? "var(--success)" : "var(--border)"} />
          <rect x="35" y="24" width="10" height="4" rx="1" fill={portAssignments["slot_top"] ? "var(--success)" : "var(--border)"} />
        </svg>
      </div>
      <p className="font-mono text-[7px] text-text-muted uppercase tracking-widest mt-0.5 leading-none">
        {hasHardware ? `${assignedHwIds.length} componente(s)` : "Sin componentes"}
      </p>

      {!hasHardware && (
        <div className="flex items-center gap-1 mt-0.5">
          <BsRobot className="text-[8px] text-text-muted/40" />
          <span className="font-mono text-[6px] text-text-muted/40 uppercase tracking-wider leading-none">
            Arrastra hardware a los slots
          </span>
        </div>
      )}
    </div>
  );
};
