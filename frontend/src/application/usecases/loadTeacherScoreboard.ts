import {isAxiosError} from "axios";
import {apiService} from "../../infrastructure/api/apiService";
import {gameProgressService} from "../../infrastructure/api/gameProgressService";
import {mergeRankings} from "./mergeRankings";
import type {DropoutRiskResponse,PlayerProfileDTO,RankingDTO} from "../../infrastructure/api/models/apiModels";
import type {GameProgressDTO} from "../../infrastructure/api/models/gameProgressModels";

export interface VerifiedStudentSummary {
  student:RankingDTO;profile:PlayerProfileDTO|null;progress:GameProgressDTO|null;risk:DropoutRiskResponse|null;errors:string[];
}
/** Access is scoped by the server; no declared grade or inferred ML feature contributes to these metrics. */
export async function loadTeacherScoreboard() {
  const [groups,courses]=await Promise.all([apiService.groups.getAll(),apiService.courses.getAll()]);
  const rankings=await Promise.all(groups.map(group=>apiService.ranking.getGroupRanking(group.idGroup)));
  const roster=mergeRankings(rankings.map(rows=>rows.map(row=>({...row,studentId:row.idStudent,totalScore:row.totalPoints}))));
  const students:VerifiedStudentSummary[]=[];
  for(let offset=0;offset<roster.length;offset+=5)students.push(...await Promise.all(roster.slice(offset,offset+5).map(async student=>{
    const [profile,progress,risk]=await Promise.allSettled([apiService.profile.get(student.idStudent),gameProgressService.progress(student.idStudent),apiService.analytics.getDropoutRisk(student.idStudent)]);
    const errors:string[]=[];
    const validProfile=profile.status==="fulfilled"&&profile.value?.idStudent===student.idStudent&&Number.isFinite(profile.value.totalPoints)&&Number.isFinite(profile.value.xpTotal);
    const validProgress=progress.status==="fulfilled"&&Array.isArray(progress.value?.levels)&&progress.value.totalLevels===60&&progress.value.levels.length===progress.value.totalLevels;
    if(!validProfile)errors.push("puntaje/XP");if(!validProgress)errors.push("progreso");
    if(risk.status==="rejected"&&!(isAxiosError(risk.reason)&&risk.reason.response?.status===404))errors.push("análisis");
    return {student,profile:validProfile&&profile.status==="fulfilled"?profile.value:null,progress:validProgress&&progress.status==="fulfilled"?progress.value:null,risk:risk.status==="fulfilled"?risk.value:null,errors};
  })));
  return {students,courseCount:courses.length};
}
