import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "../components/common/Modal";
import { Search as BsSearch, X as BsXLg } from "lucide-react";
import { apiService } from "../../infrastructure/api/apiService";
import type { RankingDTO, GroupDTO, UserResponseDTO } from "../../infrastructure/api/models/apiModels";

import { HelpRequestHistory } from "../components/common/HelpRequestHistory";

interface GroupWithStudents extends GroupDTO {
  students: RankingDTO[];
  avgScore: number;
  avgStars: number;
  avgLevel: number;
}

export const DocenteEstudiantesPage: React.FC = () => {
  const [groups, setGroups] = useState<GroupWithStudents[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithStudents | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState<{ groupId: string; studentId: string; studentName: string } | null>(null);

  const [allUsers, setAllUsers] = useState<UserResponseDTO[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string } | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const loadGroups = useCallback(async () => {
    try {
      const groupsData = await apiService.groups.getAll();
      if (!groupsData || groupsData.length === 0) {
        setGroups([]);
        setIsLoading(false);
        return;
      }

      const groupsWithStudents: GroupWithStudents[] = await Promise.all(
        groupsData.map(async (g) => {
          try {
            const students = await apiService.ranking.getGroupRanking(g.idGroup);
            const avgScore = students.length > 0
              ? Math.round(students.reduce((sum, s) => sum + (s.totalPoints || 0), 0) / students.length)
              : 0;
            const avgStars = students.length > 0
              ? Math.round(students.reduce((sum, s) => sum + (s.totalStars || 0), 0) / students.length)
              : 0;
            const avgLevel = students.length > 0
              ? Math.round(students.reduce((sum, s) => sum + (s.level || 1), 0) / students.length)
              : 1;
            return { ...g, students, avgScore, avgStars, avgLevel };
          } catch {
            return { ...g, students: [], avgScore: 0, avgStars: 0, avgLevel: 1 };
          }
        })
      );

      setGroups(groupsWithStudents);
    } catch {
      setGroups([]);
    }
    setIsLoading(false);
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const users = await apiService.users.getAll();
      setAllUsers(users || []);
    } catch {
      setAllUsers([]);
    }
  }, []);

  useEffect(() => {
    loadGroups();
    loadUsers();
  }, [loadGroups, loadUsers]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredUsers = allUsers.filter((u) => {
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || u.email.toLowerCase().includes(query);
  });

  const handleAddStudent = async (groupId: string) => {
    if (!selectedStudent) return;
    setIsAdding(true);
    try {
      await apiService.ranking.addToGroup({ idGroup: groupId, idStudent: selectedStudent.id });
      setSelectedStudent(null);
      setSearchQuery("");
      const updatedStudents = await apiService.ranking.getGroupRanking(groupId);
      const avgScore = updatedStudents.length > 0
        ? Math.round(updatedStudents.reduce((sum, s) => sum + (s.totalPoints || 0), 0) / updatedStudents.length)
        : 0;
      const avgStars = updatedStudents.length > 0
        ? Math.round(updatedStudents.reduce((sum, s) => sum + (s.totalStars || 0), 0) / updatedStudents.length)
        : 0;
      const avgLevel = updatedStudents.length > 0
        ? Math.round(updatedStudents.reduce((sum, s) => sum + (s.level || 1), 0) / updatedStudents.length)
        : 1;
      setSelectedGroup((prev) => prev ? { ...prev, students: updatedStudents, avgScore, avgStars, avgLevel } : prev);
      setGroups((prev) => prev.map((g) =>
        g.idGroup === groupId ? { ...g, students: updatedStudents, avgScore, avgStars, avgLevel } : g
      ));
    } catch (err) {
      console.error("Error adding student:", err);
    }
    setIsAdding(false);
  };

  const handleRemoveStudent = async () => {
    if (!removeConfirm) return;
    try {
      await apiService.ranking.removeFromGroup(removeConfirm.groupId, removeConfirm.studentId);
      setRemoveConfirm(null);
      const updatedStudents = await apiService.ranking.getGroupRanking(removeConfirm.groupId);
      const avgScore = updatedStudents.length > 0
        ? Math.round(updatedStudents.reduce((sum, s) => sum + (s.totalPoints || 0), 0) / updatedStudents.length)
        : 0;
      const avgStars = updatedStudents.length > 0
        ? Math.round(updatedStudents.reduce((sum, s) => sum + (s.totalStars || 0), 0) / updatedStudents.length)
        : 0;
      const avgLevel = updatedStudents.length > 0
        ? Math.round(updatedStudents.reduce((sum, s) => sum + (s.level || 1), 0) / updatedStudents.length)
        : 1;
      setSelectedGroup((prev) => prev ? { ...prev, students: updatedStudents, avgScore, avgStars, avgLevel } : prev);
      setGroups((prev) => prev.map((g) =>
        g.idGroup === removeConfirm.groupId ? { ...g, students: updatedStudents, avgScore, avgStars, avgLevel } : g
      ));
    } catch (err) {
      console.error("Error removing student:", err);
    }
  };

  const helpStudents = useMemo(() => [...new Map(groups.flatMap(g => g.students).map(student => [student.idStudent, student])).values()], [groups]);

  const alreadyInGroup = (userId: string) => {
    if (!selectedGroup) return false;
    return selectedGroup.students.some((s) => s.idStudent === userId);
  };

  return (
    <main className="flex-1 p-8 max-w-7xl mx-auto w-full animate-fade-in-soft">
      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Gestión de <span className="text-primary">Estudiantes</span>
        </h1>
        <p className="text-xs text-text-muted max-w-md font-medium">
          Organiza tus grupos y consulta las ayudas registradas por sus estudiantes.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Groups Column */}
        <div className="lg:col-span-8 space-y-8">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-text-muted mb-6">
            Grupos Asignados
          </h2>

          {isLoading ? (
            <div className="text-center py-20 text-text-muted text-xs font-mono uppercase tracking-widest animate-pulse">
              Cargando grupos...
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-20 text-text-muted text-xs">
              No hay grupos disponibles.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groups.map((group) => (
                <button type="button"
                  key={group.idGroup}
                  aria-label={`Abrir grupo ${group.groupName}`} onClick={() => setSelectedGroup(group)}
                  className={`group bg-surface border p-8 flex flex-col justify-between transition-all duration-700 cursor-pointer  hover:shadow-xl ${
                    selectedGroup?.idGroup === group.idGroup
                      ? "border-primary/40 bg-primary/5"
                      : "border-border hover:border-primary/20"
                  }`}
                  style={{ borderRadius: "var(--theme-radius)" }}
                >
                  <div className="flex justify-between items-start mb-10">
                    <div>
                      <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">
                        {group.groupName}
                      </h3>
                      <p className="text-xs font-mono text-text-muted uppercase tracking-widest">
                        {group.students.length} Estudiantes • Activo
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-black uppercase tracking-[0.2em] text-text-muted">
                      <span>Promedio de puntos</span>
                      <span className="text-primary">{group.avgScore}</span>
                    </div>
                    <div className="flex justify-between text-xs font-black uppercase tracking-[0.2em] text-text-muted">
                      <span>Estrellas Prom.</span>
                      <span>⭐ {group.avgStars}</span>
                    </div>
                    <div className="flex justify-between text-xs font-black uppercase tracking-[0.2em] text-text-muted">
                      <span>Nivel Prom.</span>
                      <span className="text-primary">Nv.{group.avgLevel}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-4">{!isLoading && <HelpRequestHistory students={helpStudents} />}</div>
      </div>

      {/* GROUP STUDENT MANAGEMENT MODAL */}
      <Modal
        title="Gestionar estudiantes del grupo"
        isOpen={selectedGroup !== null}
        onClose={() => {
          setSelectedGroup(null);
          setSelectedStudent(null);
          setSearchQuery("");
          setShowDropdown(false);
        }}
        maxWidth="max-w-4xl"
        height="auto"
      >
        {selectedGroup && (
          <div className="flex flex-col h-full">
            <div className="relative min-h-28 bg-primary/10 flex items-center px-5 pr-14 py-5 border-b border-border">
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(var(--theme-primary) 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
              </div>
              <div className="relative flex items-center gap-3">
                <div className="w-14 h-14 shrink-0 rounded-2xl bg-surface shadow-lg flex items-center justify-center border border-border rotate-3 transition-all duration-500">
                  <span className="text-2xl font-black text-primary">{selectedGroup.groupName.charAt(0)}</span>
                </div>
                <div>
                  <span className="text-xs font-black text-primary uppercase tracking-[0.4em] mb-1 block">Gestión de Grupo</span>
                  <h2 className="text-xl font-bold tracking-tight">{selectedGroup.groupName}</h2>
                  <p className="text-xs font-medium text-text-muted">
                    {selectedGroup.students.length} estudiantes • Prom. puntos: {selectedGroup.avgScore} • ⭐ {selectedGroup.avgStars} • Nv.{selectedGroup.avgLevel}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* Student search + add */}
              <div
                className="relative mb-8 overflow-visible border border-primary/15 bg-[oklch(15%_0.018_250)]/95 p-4 shadow-[0_20px_70px_rgba(5,150,105,0.12)]"
                ref={searchRef}
                style={{ borderRadius: "calc(var(--theme-radius) + 10px)" }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-45"
                  style={{
                    borderRadius: "calc(var(--theme-radius) + 10px)",
                    background:
                      "radial-gradient(circle at 14% 18%, color-mix(in oklch, var(--theme-primary) 18%, transparent), transparent 28%), linear-gradient(180deg, color-mix(in oklch, var(--theme-primary) 7%, transparent), transparent 72%)",
                  }}
                />
                <div
                  className="pointer-events-none absolute inset-x-4 bottom-0 h-px"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, color-mix(in oklch, var(--theme-primary) 42%, transparent), transparent)",
                  }}
                />

                <div className="relative flex flex-col gap-3 md:flex-row md:items-end">
                <div className="relative flex-1">
                  <label htmlFor="student-search" className="mb-2 block text-xs font-black uppercase tracking-[0.28em] text-primary">
                    Agregar estudiante
                  </label>
                  <div className="relative">
                    <BsSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none text-sm" />
                    <input id="student-search"
                      value={selectedStudent ? selectedStudent.name : searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSelectedStudent(null);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="Buscar por nombre o email..."
                      className="w-full border border-primary/35 bg-surface pl-11 pr-10 py-4 text-sm text-text shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition-all placeholder:text-text-muted focus:border-primary focus:bg-surface focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--theme-primary)_18%,transparent)]"
                      style={{ borderRadius: "var(--theme-radius)" }}
                    />
                    {(searchQuery || selectedStudent) && (
                      <button
                        onClick={() => { setSearchQuery(""); setSelectedStudent(null); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-text-muted transition-colors hover:bg-surface hover:text-text-muted"
                        aria-label="Limpiar búsqueda"
                      >
                        <BsXLg className="text-xs" />
                      </button>
                    )}
                  </div>

                  {showDropdown && (
                    <div
                      className="absolute left-0 right-0 top-full z-[80] mt-3 max-h-72 overflow-y-auto border border-primary/20 bg-surface shadow-[0_28px_80px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.03)] custom-scrollbar"
                      style={{ borderRadius: "calc(var(--theme-radius) + 4px)" }}
                    >
                      {filteredUsers.length === 0 ? (
                        <div className="px-5 py-8 text-center">
                          <p className="text-xs font-semibold text-text-muted">
                            {searchQuery ? "No se encontraron estudiantes." : "Escribe para buscar estudiantes."}
                          </p>
                          <p className="mt-1 text-xs text-text-muted">
                            Puedes buscar por nombre, apellido o correo.
                          </p>
                        </div>
                      ) : (
                        filteredUsers.map((u, i) => {
                          const inGroup = alreadyInGroup(u.idUser);
                          return (
                            <React.Fragment key={u.idUser}>
                              {i > 0 && <div className="mx-4 border-t border-border" />}
                              <button
                                onClick={() => {
                                  if (!inGroup) {
                                    setSelectedStudent({ id: u.idUser, name: `${u.firstName} ${u.lastName}` });
                                    setSearchQuery(`${u.firstName} ${u.lastName}`);
                                    setShowDropdown(false);
                                  }
                                }}
                                disabled={inGroup}
                                className={`w-full text-left px-4 py-3.5 text-sm flex items-center gap-3 transition-all ${
                                  inGroup
                                    ? "opacity-45 cursor-not-allowed"
                                    : "hover:bg-primary/10 focus:bg-primary/10 focus:outline-none cursor-pointer"
                                }`}
                              >
                                <div
                                  className="w-9 h-9 border border-primary/20 flex items-center justify-center text-xs font-black text-primary shrink-0"
                                  style={{
                                    background:
                                      "linear-gradient(145deg, color-mix(in oklch, var(--theme-primary) 16%, var(--surface-brighter)), var(--surface-brighter))",
                                    borderRadius: "var(--theme-radius)",
                                  }}
                                >
                                  {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-text truncate">{u.firstName} {u.lastName}</p>
                                  <p className="text-xs text-text-muted font-mono truncate">{u.email}</p>
                                </div>
                                {inGroup && (
                                  <span className="shrink-0 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-black uppercase tracking-widest text-primary">
                                    En el grupo
                                  </span>
                                )}
                              </button>
                            </React.Fragment>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleAddStudent(selectedGroup.idGroup)}
                  disabled={!selectedStudent || isAdding}
                  className="btn-premium w-full px-8 py-4 text-xs font-black tracking-widest disabled:opacity-40 md:w-auto md:shrink-0"
                >
                  {isAdding ? "AGREGANDO..." : "AGREGAR"}
                </button>
                </div>
              </div>

              {/* Student Table */}
              {selectedGroup.students.length === 0 ? (
                <div className="text-center py-16 text-text-muted text-xs">
                  <div className="text-4xl mb-4 opacity-20">👤</div>
                  <p className="font-semibold mb-1">Grupo vacío</p>
                  <p className="text-xs text-text-muted">Busca y agrega estudiantes desde el campo de arriba.</p>
                </div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left font-mono">
                    <thead>
                      <tr className="text-xs uppercase tracking-widest border-b text-muted-foreground">
                        <th className="px-4 py-3 font-normal">Estudiante</th>
                        <th className="px-4 py-3 font-normal">Nivel</th>
                        <th className="px-4 py-3 font-normal">XP Total</th>
                        <th className="px-4 py-3 font-normal">Estrellas</th>
                        <th className="px-4 py-3 font-normal">Racha</th>
                        <th className="px-4 py-3 font-normal text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {selectedGroup.students.map((student) => (
                        <tr key={student.idStudent} className="border-b transition-colors duration-200 hover:bg-muted/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 border flex items-center justify-center font-bold text-xs"
                                style={{ backgroundColor: "var(--surface-brighter)", borderColor: "var(--border)", color: "var(--text)", borderRadius: "var(--theme-radius)" }}
                              >
                                {(student.studentName || "E").charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="max-w-[220px] truncate font-semibold">{student.studentName || `Estudiante #${student.position}`}</p>
                                <p className="max-w-[220px] truncate text-xs text-text-muted font-mono">{student.idStudent}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 text-xs font-mono bg-primary/10 text-primary" style={{ borderRadius: "var(--theme-radius)" }}>
                              Nv.{student.level || 1}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-primary">
                            {(student.totalPoints || 0).toLocaleString()} XP
                          </td>
                          <td className="px-4 py-3">
                            ⭐ {student.totalStars || 0}
                          </td>
                          <td className="px-4 py-3">
                            🔥 {student.currentStreak || 0}
                            {student.maxStreak > 0 && (
                              <span className="text-text-muted ml-1">(máx: {student.maxStreak})</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setRemoveConfirm({
                                groupId: selectedGroup.idGroup,
                                studentId: student.idStudent,
                                studentName: student.studentName || `Estudiante #${student.position}`
                              })}
                              className="px-3 py-1.5 text-xs font-bold uppercase tracking-widest border border-red-500/30 text-danger hover:bg-red-500/10 transition-all"
                              style={{ borderRadius: "var(--theme-radius)" }}
                            >
                              REMOVER
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* REMOVE CONFIRM MODAL — siempre al final para estar por encima */}
      <Modal
        isOpen={removeConfirm !== null}
        onClose={() => setRemoveConfirm(null)}
        maxWidth="max-w-md"
        height="auto"
        zIndex={2001}
      >
        {removeConfirm && (
          <div className="p-8">
            <h3 className="text-lg font-bold mb-2">Remover Estudiante</h3>
            <p className="text-sm text-text-muted mb-6">
              ¿Estás seguro de que deseas remover a <strong>{removeConfirm.studentName}</strong> del grupo?
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setRemoveConfirm(null)}
                className="px-6 py-3 text-xs font-bold uppercase tracking-widest border border-border hover:bg-surface transition-all"
                style={{ borderRadius: "var(--theme-radius)" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleRemoveStudent}
                className="px-6 py-3 text-xs font-bold uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 transition-all"
                style={{ borderRadius: "var(--theme-radius)" }}
              >
                Remover
              </button>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
};

export default DocenteEstudiantesPage;
