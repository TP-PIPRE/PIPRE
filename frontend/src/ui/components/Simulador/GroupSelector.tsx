import { useEffect, useState } from "react";
import { specService } from "../../../infrastructure/api/specService";
import type { GroupInfo } from "../../../shared/types/SpecContracts";

interface GroupSelectorProps {
  selectedGroupId: string | null;
  onSelect: (groupId: string) => void;
}

export const GroupSelector = ({
  selectedGroupId,
  onSelect,
}: GroupSelectorProps) => {
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    specService.groups
      .getAll()
      .then(setGroups)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-text-muted text-sm animate-pulse">
        Cargando grupos...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] uppercase font-bold tracking-widest text-text-muted">
        Grupo
      </label>
      <select
        className="w-full p-2.5 bg-bg border border-border text-sm text-text focus:outline-none focus:border-primary transition-colors"
        style={{ borderRadius: "var(--theme-radius)" }}
        value={selectedGroupId ?? ""}
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="" disabled>
          Seleccionar grupo...
        </option>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
    </div>
  );
};
