import {apiService} from "../../infrastructure/api/apiService";
import {loadCourseActivities} from "./loadCourseActivities";

/** Read only persisted curriculum and visible memberships; failures are not empty data. */
export async function loadTeacherDashboard() {
  const [groups,courses]=await Promise.all([apiService.groups.getAll(),apiService.courses.getAll()]);
  const rankings=await Promise.all(groups.map(group=>apiService.ranking.getGroupRanking(group.idGroup)));
  const byStudent=new Map(rankings.flat().map(row=>[row.idStudent,row]));
  const ranking=[...byStudent.values()].sort((a,b)=>b.totalPoints-a.totalPoints||a.idStudent.localeCompare(b.idStudent))
    .map((row,index)=>({...row,position:index+1}));
  const challenges=(await Promise.all(courses.map(async course=>(await loadCourseActivities(course.idCourse)).map(activity=>({
    id:activity.idActivity,nombre:activity.name,categoria:course.name,courseId:course.idCourse,
    dificultad:activity.difficulty==="HARD"?3:activity.difficulty==="EASY"?1:2,estado:true,
  }))))).flat().slice(0,10);
  return {groups,courses,ranking,challenges};
}
