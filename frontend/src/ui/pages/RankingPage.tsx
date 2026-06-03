import React, { useEffect, useState } from "react";
import { apiService } from "../../infrastructure/api/apiService";
import type { RankingDTO } from "../../infrastructure/api/models/apiModels";

const MOCK_RANKING_SEED: { id: string; name: string; group: string; xp: number }[] = [
  { id: "student-2", name: "Ana Sofía Lopez", group: "Robótica A", xp: 12500 },
  { id: "student-3", name: "Carlos Ruiz", group: "Mecatrónica B", xp: 11800 },
  { id: "student-4", name: "Elena García", group: "Robótica A", xp: 11250 },
  { id: "student-5", name: "Marcos Soto", group: "Sistemas I", xp: 10900 },
  { id: "student-6", name: "Lucía Méndez", group: "Robótica A", xp: 10450 },
];

interface RankingEntry {
  position: number;
  studentId: string;
  studentName: string;
  totalScore: number;
  challengesCompleted: number;
  lastUpdated: string;
  group?: string;
}

export const RankingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"global" | "course">("global");
  const [selectedCourse, setSelectedCourse] = useState<string>("1");
  const [rankingData, setRankingData] = useState<RankingEntry[]>([]);
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const mapFromDto = (data: RankingDTO[]): RankingEntry[] =>
    data.map((dto) => {
      const seed = MOCK_RANKING_SEED.find(s => s.id === dto.id_student);
      return {
        position: dto.position,
        studentId: dto.id_student,
        studentName: seed?.name ?? `Estudiante ${dto.id_student}`,
        totalScore: dto.total_points,
        challengesCompleted: 0,
        lastUpdated: new Date().toISOString(),
        group: seed?.group,
      };
    });

  const fetchRanking = async () => {
    setIsLoading(true);
    try {
      const groupId = "group-1";
      const data = await apiService.ranking.getGroupRanking(groupId);
      if (data && data.length > 0) {
        setRankingData(mapFromDto(data));
      } else {
        setRankingData(
          activeTab === "global" ? getFallbackGlobal() : getFallbackCourse(selectedCourse),
        );
      }
    } catch {
      setRankingData(
        activeTab === "global" ? getFallbackGlobal() : getFallbackCourse(selectedCourse),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackGlobal = (): RankingEntry[] => {
    return MOCK_RANKING_SEED.map((s, i) => ({
      position: i + 1,
      studentId: s.id,
      studentName: s.name,
      totalScore: s.xp,
      challengesCompleted: Math.floor(Math.random() * 5) + 1,
      lastUpdated: new Date().toISOString(),
      group: s.group,
    }));
  };

  const getFallbackCourse = (courseId: string): RankingEntry[] => {
    const courseFiltered = courseId === "1"
      ? MOCK_RANKING_SEED.filter((_, i) => i % 2 === 0)
      : MOCK_RANKING_SEED.filter((_, i) => i % 2 === 1);
    return courseFiltered.map((s, i) => ({
      position: i + 1,
      studentId: s.id,
      studentName: s.name,
      totalScore: s.xp - Math.floor(Math.random() * 2000),
      challengesCompleted: Math.floor(Math.random() * 3) + 1,
      lastUpdated: new Date().toISOString(),
      group: s.group,
    }));
  };

  useEffect(() => {
    fetchRanking();
  }, [activeTab, selectedCourse]);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await apiService.courses.getAll();
        if (data && data.length > 0) {
          setCourses(data.map((c) => ({ id: c.id_course, name: c.name })));
        } else {
          setCourses([
            { id: "1", name: "Robótica Nivel 1" },
            { id: "2", name: "Programación de Microcontroladores" },
          ]);
        }
      } catch {
        setCourses([
          { id: "1", name: "Robótica Nivel 1" },
          { id: "2", name: "Programación de Microcontroladores" },
        ]);
      }
    };
    loadCourses();
  }, []);

  const top3 = rankingData.slice(0, 3);
  const rest = rankingData.slice(3);

  return (
    <main
      className="flex-1 p-6 max-w-5xl mx-auto w-full"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <header className="mb-12 text-center">
        <h1
          className="text-2xl font-mono font-bold tracking-[0.1em] mb-3 uppercase"
          style={{ color: "var(--text)" }}
        >
          Comunidad & Ranking
        </h1>
        <p
          className="text-sm font-medium max-w-xl mx-auto"
          style={{ color: "var(--text-muted)" }}
        >
          Resultados de los retos de simulación. Compite y escala en el ranking.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex justify-center gap-8 mb-12">
        <button
          onClick={() => setActiveTab("global")}
          className={`text-[10px] font-mono font-bold uppercase tracking-widest pb-2 transition-all ${
            activeTab === "global"
              ? "text-primary border-b-2 border-primary"
              : "text-text-muted hover:text-text"
          }`}
        >
          Global
        </button>
        <button
          onClick={() => setActiveTab("course")}
          className={`text-[10px] font-mono font-bold uppercase tracking-widest pb-2 transition-all ${
            activeTab === "course"
              ? "text-primary border-b-2 border-primary"
              : "text-text-muted hover:text-text"
          }`}
        >
          Por Curso
        </button>
      </div>

      {/* Course selector */}
      {activeTab === "course" && (
        <div className="flex justify-center mb-8">
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="bg-bg border border-border/30 px-4 py-2 text-sm focus:border-primary outline-none"
            style={{ borderRadius: "var(--theme-radius)" }}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-20 text-text-muted text-[10px] font-mono uppercase tracking-widest animate-pulse">
          Cargando ranking...
        </div>
      ) : (
        <>
          {/* Top 3 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {top3[1] && (
              <div className="order-2 md:order-1 pt-8">
                <div
                  className="border border-border p-6 text-center flex flex-col items-center transition-all duration-300 hover:shadow-lg hover:scale-105"
                  style={{ backgroundColor: "var(--surface)", borderRadius: "var(--theme-radius)" }}
                >
                  <div
                    className="w-12 h-12 flex items-center justify-center border border-border font-bold mb-4"
                    style={{ backgroundColor: "var(--surface-brighter)", color: "var(--text)", borderRadius: "var(--theme-radius)" }}
                  >
                    2
                  </div>
                  <p className="font-bold text-sm mb-1" style={{ color: "var(--text)" }}>{top3[1].studentName}</p>
                  <p className="text-[10px] font-mono mb-4 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                    {top3[1].group || "Estudiante"}
                  </p>
                  <span className="text-xs font-mono font-bold" style={{ color: "var(--primary)" }}>
                    {top3[1].totalScore.toLocaleString()} XP
                  </span>
                </div>
              </div>
            )}

            {top3[0] && (
              <div className="order-1 md:order-2">
                <div
                  className="border-2 p-8 text-center flex flex-col items-center relative transform scale-105 transition-all duration-300 hover:shadow-2xl hover:scale-110"
                  style={{
                    borderColor: "var(--primary)",
                    backgroundColor: "rgba(var(--primary-rgb), 0.05)",
                    boxShadow: "0 0 30px rgba(var(--primary-rgb), 0.1)",
                    borderRadius: "var(--theme-radius)",
                  }}
                >
                  <div
                    className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 font-mono font-bold text-[10px] tracking-widest uppercase"
                    style={{ backgroundColor: "var(--primary)", color: "var(--bg)", borderRadius: "var(--theme-radius)" }}
                  >
                    Líder
                  </div>
                  <div
                    className="w-16 h-16 flex items-center justify-center border font-black text-xl mb-4"
                    style={{ backgroundColor: "var(--primary)", borderColor: "var(--primary)", color: "var(--bg)", borderRadius: "var(--theme-radius)" }}
                  >
                    1
                  </div>
                  <p className="font-bold text-lg mb-1" style={{ color: "var(--text)" }}>{top3[0].studentName}</p>
                  <p className="text-[10px] font-mono mb-4 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                    {top3[0].group || "Estudiante"}
                  </p>
                  <span className="text-sm font-mono font-bold" style={{ color: "var(--primary)" }}>
                    {top3[0].totalScore.toLocaleString()} XP
                  </span>
                </div>
              </div>
            )}

            {top3[2] && (
              <div className="order-3 pt-12">
                <div
                  className="border border-border p-6 text-center flex flex-col items-center transition-all duration-300 hover:shadow-lg hover:scale-105"
                  style={{ backgroundColor: "var(--surface)", borderRadius: "var(--theme-radius)" }}
                >
                  <div
                    className="w-10 h-10 flex items-center justify-center border border-border font-bold mb-4"
                    style={{ backgroundColor: "var(--surface-brighter)", color: "var(--text)", borderRadius: "var(--theme-radius)" }}
                  >
                    3
                  </div>
                  <p className="font-bold text-sm mb-1" style={{ color: "var(--text)" }}>{top3[2].studentName}</p>
                  <p className="text-[10px] font-mono mb-4 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                    {top3[2].group || "Estudiante"}
                  </p>
                  <span className="text-xs font-mono font-bold" style={{ color: "var(--primary)" }}>
                    {top3[2].totalScore.toLocaleString()} XP
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Tabla */}
          <div
            className="border border-border overflow-hidden"
            style={{ backgroundColor: "var(--surface)", borderRadius: "var(--theme-radius)" }}
          >
            <div
              className="p-4 border-b border-border flex justify-between items-center"
              style={{ backgroundColor: "var(--surface-brighter)" }}
            >
              <h2 className="text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: "var(--text)" }}>
                {activeTab === "global" ? "Ranking Global" : `Ranking del Curso`}
              </h2>
              <span className="text-[9px] font-mono text-text-muted">
                {rankingData.length} estudiantes
              </span>
            </div>

            <div className="divide-y" style={{ backgroundColor: "var(--surface)" }}>
              {rankingData.length === 0 ? (
                <div className="p-8 text-center text-text-muted text-xs">
                  No hay datos de ranking disponibles. Completa un reto para aparecer aquí.
                </div>
              ) : (
                rankingData.map((entry) => (
                  <div
                    key={entry.studentId}
                    className="flex items-center p-4 hover:bg-surface-brighter transition-all duration-300"
                  >
                    <div
                      className="w-10 font-mono font-bold text-center text-xs"
                      style={{ color: entry.position <= 3 ? "var(--primary)" : "var(--text-muted)" }}
                    >
                      {entry.position}
                    </div>
                    <div
                      className="w-10 h-10 border flex items-center justify-center font-bold text-xs mr-4"
                      style={{ backgroundColor: "var(--surface-brighter)", borderColor: "var(--border)", color: "var(--text)", borderRadius: "var(--theme-radius)" }}
                    >
                      {entry.studentName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold" style={{ color: "var(--text)" }}>{entry.studentName}</p>
                      <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                        {entry.group || `Retos completados: ${entry.challengesCompleted}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono font-bold" style={{ color: "var(--primary)" }}>
                        {entry.totalScore.toLocaleString()} XP
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
};

export default RankingPage;
