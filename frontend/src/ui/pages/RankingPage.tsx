import { useAsyncResource } from "../../application/hooks/useAsyncResource";
import React, { useState } from "react";
import { apiService } from "../../infrastructure/api/apiService";
import { getAuthState } from "../../infrastructure/store/authStore";
import { mergeRankings } from "../../application/usecases/mergeRankings";
import type { RankingDTO, GroupDTO } from "../../infrastructure/api/models/apiModels";

interface RankingEntry {
  position: number;
  studentId: string;
  studentName: string;
  totalScore: number;
  level: number;
  totalStars: number;
  currentStreak: number;
  maxStreak: number;
  groupName?: string;
}

type Tab = "global" | "course" | "groups";

const loadGroups = () => apiService.groups.getAll();
const loadCourses = () => apiService.courses.getAll();
const EMPTY_GROUPS:GroupDTO[]=[];
const mapFromDto = (data: RankingDTO[], groupName?: string): RankingEntry[] => data.map(dto => ({
  position:dto.position,studentId:dto.idStudent,studentName:dto.studentName||`Estudiante #${dto.position}`,
  totalScore:dto.totalPoints,level:dto.level||1,totalStars:dto.totalStars||0,
  currentStreak:dto.currentStreak||0,maxStreak:dto.maxStreak||0,groupName,
}));

export const RankingPage: React.FC = () => {
  const role=getAuthState().user?.role??"student";
  const canViewCourseRanking=["docente","admin"].includes(role);
  const [tabChoice,setActiveTab]=useState<Tab>("global");
  const [courseChoice,setSelectedCourse]=useState("");
  const [groupChoice,setSelectedGroup]=useState("");
  const [selectedModule,setSelectedModule]=useState("");
  const settings=useAsyncResource(role==="student"?"student-ranking-visibility":undefined,apiService.ranking.getSettings);
  const hidden=role==="student"&&settings.data?.studentVisibility==="HIDDEN";
  const activeTab:Tab=role==="student"&&settings.data?.studentVisibility!=="GLOBAL"?"groups":tabChoice;
  const needsGroups=activeTab==="groups"||activeTab==="global"&&role==="docente";
  const studentReady=role!=="student"||Boolean(settings.data)&&!hidden;
  const groupResource=useAsyncResource(needsGroups&&studentReady?"groups":undefined,loadGroups);
  const courseResource=useAsyncResource(activeTab==="course"?"courses":undefined,loadCourses);
  const groups=groupResource.data??EMPTY_GROUPS;
  const courses=courseResource.data??[];
  const selectedCourse=courses.find(c=>c.idCourse===courseChoice)?.idCourse??courses[0]?.idCourse??"";
  const selectedGroup=groups.find(g=>g.idGroup===groupChoice)?.idGroup??groups[0]?.idGroup??"";
  const moduleResource=useAsyncResource(activeTab==="course"&&selectedCourse?selectedCourse:undefined,()=>apiService.modules.getByCourse(selectedCourse));
  const modules=moduleResource.data??[];
  const rankingGroups=activeTab==="global"&&role==="docente"?groups:EMPTY_GROUPS;
  const rankingGroupId=activeTab==="groups"?selectedGroup:"";
  const rankingCourseId=activeTab==="course"?selectedCourse:"";
  const rankingModuleId=activeTab==="course"?selectedModule:"";
  const loadRanking=async()=>{
    if(activeTab==="global") {
      if(role!=="docente")return mapFromDto(await apiService.ranking.getGlobalRanking());
      const rows=await Promise.all(rankingGroups.map(async group=>mapFromDto(await apiService.ranking.getGroupRanking(group.idGroup),group.groupName)));
      return mergeRankings(rows);
    }
    if(activeTab==="groups")return rankingGroupId?mapFromDto(await apiService.ranking.getGroupRanking(rankingGroupId)):[];
    if(!rankingCourseId)return [];
    return mapFromDto(rankingModuleId?await apiService.ranking.getModuleRanking(rankingModuleId):await apiService.ranking.getCourseRanking(rankingCourseId));
  };
  const ready=studentReady&&(activeTab==="course"?courseResource.data!==undefined:needsGroups?groupResource.data!==undefined:true);
  const query=ready?JSON.stringify([role,activeTab,rankingGroupId,rankingCourseId,rankingModuleId,rankingGroups.map(group=>[group.idGroup,group.groupName])]):undefined;
  const rankingResource=useAsyncResource(query,loadRanking);
  const rankingData=rankingResource.data??[];
  const error=settings.error||(needsGroups&&groupResource.error)||courseResource.error||moduleResource.error||rankingResource.error;
  const isLoading=!error&&(settings.loading||(needsGroups&&groupResource.loading)||courseResource.loading||rankingResource.loading);
  const retry=()=>{settings.retry();groupResource.retry();courseResource.retry();moduleResource.retry();rankingResource.retry();};
  const tabs:Tab[]=role==="student"&&settings.data?.studentVisibility!=="GLOBAL"?["groups"]:canViewCourseRanking?["global","course","groups"]:["global","groups"];
  if(hidden)return <main className="lab-shell"><h1>Ranking</h1><p role="status">El administrador ha ocultado el ranking para estudiantes.</p></main>;

  const top3 = rankingData.slice(0, 3);

  return (
    <main className="flex-1 p-6 max-w-5xl mx-auto w-full" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <header className="mb-12 text-center">
        <h1 className="text-2xl font-mono font-bold tracking-[0.1em] mb-3 uppercase" style={{ color: "var(--text)" }}>
          Ranking
        </h1>
        <p className="text-sm font-medium max-w-xl mx-auto" style={{ color: "var(--text-muted)" }}>
          Progreso y logros de los estudiantes. Compite y escala en el ranking.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex justify-center gap-8 mb-10">
        {tabs.map((tab) => (
          <button
            key={tab}
            aria-pressed={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`text-xs font-mono font-bold uppercase tracking-widest pb-2 transition-all ${
              activeTab === tab
                ? "text-primary border-b-2 border-primary"
                : "text-text-muted hover:text-text"
            }`}
          >
            {tab === "global" ? (role==="docente"?"Mis aulas":"Global") : tab === "course" ? "Por Curso" : "Por Grupos"}
          </button>
        ))}
      </div>

      {/* Filters */}
      {activeTab === "course" && (
        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          {courses.length > 0 ? (
            <>
              <select aria-label="Filtrar por curso"
                value={selectedCourse}
                onChange={(e) => { setSelectedCourse(e.target.value); setSelectedModule(""); }}
                className="bg-bg border border-border px-4 py-2 text-sm focus:border-primary outline-none"
                style={{ borderRadius: "var(--theme-radius)" }}
              >
                {courses.map((c) => (
                  <option key={c.idCourse} value={c.idCourse}>{c.name}</option>
                ))}
              </select>
              {selectedCourse && modules.length > 0 && (
                <select aria-label="Filtrar por módulo"
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="bg-bg border border-border px-4 py-2 text-sm focus:border-primary outline-none"
                  style={{ borderRadius: "var(--theme-radius)" }}
                >
                  <option value="">Todos los módulos</option>
                  {modules.map((m) => (
                    <option key={m.idModule} value={m.idModule}>{m.title}</option>
                  ))}
                </select>
              )}
            </>
          ) : (
            <span className="text-xs text-text-muted">No hay cursos disponibles.</span>
          )}
        </div>
      )}

      {activeTab === "groups" && (
        <div className="flex justify-center mb-8">
          {groups.length > 0 ? (
            <select aria-label="Filtrar por grupo"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="bg-bg border border-border px-4 py-2 text-sm focus:border-primary outline-none"
              style={{ borderRadius: "var(--theme-radius)" }}
            >
              {groups.map((g) => (
                <option key={g.idGroup} value={g.idGroup}>{g.groupName}</option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-text-muted">No hay grupos disponibles.</span>
          )}
        </div>
      )}

      {error ? <div role="alert" className="rounded-xl border border-danger p-6 text-center"><p>No pudimos cargar el ranking. Comprueba la conexión y vuelve a intentarlo.</p><button className="btn-secondary mt-3" onClick={retry}>Reintentar</button></div> : isLoading ? (
        <div className="text-center py-20 text-text-muted text-xs font-mono uppercase tracking-widest animate-pulse">
          Cargando ranking...
        </div>
      ) : rankingData.length === 0 && !isLoading ? (
        <div className="text-center py-20">
          <p className="text-xs font-mono text-text-muted mb-2">
            {activeTab === "global" && "No hay datos de ranking global. Los estudiantes deben estar asignados a grupos y completar retos."}
            {activeTab === "course" && "No hay resultados para este curso o módulo. Los estudiantes deben completar actividades para aparecer aquí."}
            {activeTab === "groups" && "No hay estudiantes en este grupo. Asigna estudiantes desde la gestión de estudiantes."}
          </p>
          {activeTab === "course" && groups.length > 0 && (
            <p className="text-xs font-mono text-text-muted mt-2">Cambia a la pestaña "Por Grupos" para ver el ranking por grupo.</p>
          )}
          {activeTab === "groups" && courses.length > 0 && (
            <p className="text-xs font-mono text-text-muted mt-2">Cambia a la pestaña "Por Curso" para ver el ranking por curso.</p>
          )}
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {top3[1] && (
              <div className="order-2 md:order-1 pt-8">
                <div
                  className="border border-border p-6 text-center flex flex-col items-center transition-all duration-300 hover:shadow-lg "
                  style={{ backgroundColor: "var(--surface)", borderRadius: "var(--theme-radius)" }}
                >
                  <div className="w-12 h-12 flex items-center justify-center border border-border font-bold mb-4" style={{ backgroundColor: "var(--surface-brighter)", color: "var(--text)", borderRadius: "var(--theme-radius)" }}>2</div>
                  <p className="font-bold text-sm mb-1" style={{ color: "var(--text)" }}>{top3[1].studentName}</p>
                  {top3[1].groupName && <p className="text-xs font-mono text-text-muted mb-2">{top3[1].groupName}</p>}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono px-2 py-0.5 bg-primary/10 text-primary" style={{ borderRadius: "var(--theme-radius)" }}>Nv.{top3[1].level}</span>
                    <span className="text-xs">⭐ {top3[1].totalStars}</span>
                  </div>
                  <span className="text-xs font-mono font-bold" style={{ color: "var(--primary)" }}>{top3[1].totalScore.toLocaleString()} puntos</span>
                </div>
              </div>
            )}
            {top3[0] && (
              <div className="order-1 md:order-2">
                <div
                  className="border-2 p-8 text-center flex flex-col items-center relative transform  transition-all duration-300 hover:shadow-2xl "
                  style={{ borderColor: "var(--primary)", backgroundColor: "var(--primary-low)", boxShadow: "0 0 30px var(--primary-glow)", borderRadius: "var(--theme-radius)" }}
                >
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 font-mono font-bold text-xs tracking-widest uppercase" style={{ backgroundColor: "var(--primary)", color: "var(--bg)", borderRadius: "var(--theme-radius)" }}>Líder</div>
                  <div className="w-16 h-16 flex items-center justify-center border font-black text-xl mb-4" style={{ backgroundColor: "var(--primary)", borderColor: "var(--primary)", color: "var(--bg)", borderRadius: "var(--theme-radius)" }}>1</div>
                  <p className="font-bold text-lg mb-1" style={{ color: "var(--text)" }}>{top3[0].studentName}</p>
                  {top3[0].groupName && <p className="text-xs font-mono text-text-muted mb-2">{top3[0].groupName}</p>}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono px-2 py-0.5 bg-primary/10 text-primary" style={{ borderRadius: "var(--theme-radius)" }}>Nv.{top3[0].level}</span>
                    <span className="text-xs">⭐ {top3[0].totalStars}</span>
                  </div>
                  <span className="text-sm font-mono font-bold" style={{ color: "var(--primary)" }}>{top3[0].totalScore.toLocaleString()} puntos</span>
                </div>
              </div>
            )}
            {top3[2] && (
              <div className="order-3 pt-12">
                <div
                  className="border border-border p-6 text-center flex flex-col items-center transition-all duration-300 hover:shadow-lg "
                  style={{ backgroundColor: "var(--surface)", borderRadius: "var(--theme-radius)" }}
                >
                  <div className="w-10 h-10 flex items-center justify-center border border-border font-bold mb-4" style={{ backgroundColor: "var(--surface-brighter)", color: "var(--text)", borderRadius: "var(--theme-radius)" }}>3</div>
                  <p className="font-bold text-sm mb-1" style={{ color: "var(--text)" }}>{top3[2].studentName}</p>
                  {top3[2].groupName && <p className="text-xs font-mono text-text-muted mb-2">{top3[2].groupName}</p>}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono px-2 py-0.5 bg-primary/10 text-primary" style={{ borderRadius: "var(--theme-radius)" }}>Nv.{top3[2].level}</span>
                    <span className="text-xs">⭐ {top3[2].totalStars}</span>
                  </div>
                  <span className="text-xs font-mono font-bold" style={{ color: "var(--primary)" }}>{top3[2].totalScore.toLocaleString()} puntos</span>
                </div>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="border border-border overflow-hidden" style={{ backgroundColor: "var(--surface)", borderRadius: "var(--theme-radius)" }}>
            <div className="p-4 border-b border-border flex justify-between items-center" style={{ backgroundColor: "var(--surface-brighter)" }}>
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest" style={{ color: "var(--text)" }}>
                {activeTab === "global" ? "Ranking Global" : activeTab === "course" ? (selectedModule ? "Ranking por Módulo" : "Ranking por Curso") : "Ranking del Grupo"}
              </h2>
              <span className="text-xs font-mono text-text-muted">{rankingData.length} estudiantes</span>
            </div>
            <div className="divide-y" style={{ backgroundColor: "var(--surface)" }}>
              {rankingData.map((entry) => (
                <div key={`${entry.groupName || ""}-${entry.studentId}`} className="flex items-center p-4 hover:bg-surface-brighter transition-all duration-300">
                  <div className="w-10 font-mono font-bold text-center text-xs" style={{ color: entry.position <= 3 ? "var(--primary)" : "var(--text-muted)" }}>{entry.position}</div>
                  <div className="w-10 h-10 border flex items-center justify-center font-bold text-xs mr-4" style={{ backgroundColor: "var(--surface-brighter)", borderColor: "var(--border)", color: "var(--text)", borderRadius: "var(--theme-radius)" }}>{entry.studentName.charAt(0)}</div>
                  <div className="flex-1">
                    <p className="text-xs font-bold" style={{ color: "var(--text)" }}>{entry.studentName}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {entry.groupName && <span className="text-xs font-mono text-text-muted">{entry.groupName}</span>}
                      <span className="text-xs font-mono text-primary">Nv.{entry.level}</span>
                      <span className="text-xs">⭐ {entry.totalStars}</span>
                      <span className="text-xs text-text-muted">🔥 {entry.currentStreak}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-bold" style={{ color: "var(--primary)" }}>{entry.totalScore.toLocaleString()} puntos</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  );
};

export default RankingPage;
