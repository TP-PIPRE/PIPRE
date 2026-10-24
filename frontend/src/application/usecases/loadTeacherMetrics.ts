import { isAxiosError } from "axios";
import { apiService } from "../../infrastructure/api/apiService";
import type { ActivityResultResponse, DropoutRiskResponse, ModuleProgressDTO, RankingDTO } from "../../infrastructure/api/models/apiModels";
import { mergeRankings } from "./mergeRankings";

export interface StudentMetrics {
  student: RankingDTO;
  risk: DropoutRiskResponse | null;
  progress: ModuleProgressDTO[];
  results: ActivityResultResponse[];
  errors: string[];
}
export interface AcademicModule { idModule: string; title: string; courseName: string; activityIds: string[] }

export function summarizeModule(module: AcademicModule, students: StudentMetrics[]) {
  const progress = students.flatMap(s => {
    const latest = s.progress.filter(p => p.idModule === module.idModule).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    return latest ? [latest] : [];
  });
  const results = students.flatMap(s => s.results.filter(r => module.activityIds.includes(r.idActivity)));
  return {
    ...module,
    recordedStudents: progress.length,
    completedStudents: progress.filter(p => Number(p.percentage) >= 100).length,
    averageProgress: progress.length ? Math.round(progress.reduce((sum, p) => sum + Number(p.percentage), 0) / progress.length) : null,
    averageScore: results.length ? Math.round(results.reduce((sum, r) => sum + Number(r.score), 0) / results.length) : null,
    resultCount: results.length,
  };
}

export async function loadTeacherMetrics() {
  const [groups, courses] = await Promise.all([apiService.groups.getAll(), apiService.courses.getAll()]);
  const rankings = await Promise.all(groups.map(g => apiService.ranking.getGroupRanking(g.idGroup)));
  const roster = mergeRankings(rankings.map(group => group.map(s => ({ ...s, studentId: s.idStudent, totalScore: s.totalPoints }))));
  const students: StudentMetrics[] = [];
  // Bound the number of per-student reads for larger cohorts.
  for (let offset = 0; offset < roster.length; offset += 5) {
    students.push(...await Promise.all(roster.slice(offset, offset + 5).map(async student => {
      const [risk, progress, results] = await Promise.allSettled([
        apiService.analytics.getDropoutRisk(student.idStudent),
        apiService.analytics.getProgressByUser(student.idStudent),
        apiService.results.getByUser(student.idStudent),
      ]);
      const errors: string[] = [];
      if (risk.status === "rejected" && !(isAxiosError(risk.reason) && risk.reason.response?.status === 404)) errors.push("análisis");
      if (progress.status === "rejected") errors.push("progreso");
      if (results.status === "rejected") errors.push("resultados");
      return { student, risk: risk.status === "fulfilled" ? risk.value : null,
        progress: progress.status === "fulfilled" ? progress.value : [],
        results: results.status === "fulfilled" ? results.value : [], errors };
    })));
  }
  const modules = (await Promise.all(courses.map(async course => {
    const courseModules = await apiService.modules.getByCourse(course.idCourse);
    return Promise.all(courseModules.map(async module => {
      const lessons = await apiService.lessons.getByModule(module.idModule);
      const activities = (await Promise.all(lessons.map(l => apiService.activities.getByLesson(l.idLesson)))).flat();
      return summarizeModule({ ...module, courseName: course.name, activityIds: activities.map(a => a.idActivity) }, students);
    }));
  }))).flat();
  return { students, modules, courseCount: courses.length };
}
