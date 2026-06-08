import { useEffect, useState } from "react";
import { apiService } from "../../../infrastructure/api/apiService";
import type { Group } from "../../../shared/types/Group";

interface GroupSelectorProps {
  selectedGroupId: string | null;
  onSelect: (groupId: string) => void;
}

export const GroupSelector = ({
  selectedGroupId,
  onSelect,
}: GroupSelectorProps) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.groups
      .getAll()
      .then((data) => {
        setGroups(
          data.map((g) => ({ idGroup: g.idGroup, groupName: g.groupName })),
        );
      })
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
          <option key={g.idGroup} value={g.idGroup}>
            {g.groupName}
          </option>
        ))}
      </select>
    </div>
  );
};
