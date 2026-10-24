import { apiService } from "../../infrastructure/api/apiService";
import { compareActivities } from "./activityLevels";

export async function loadCourseActivities(courseId: string) {
  const modules = await apiService.modules.getByCourse(courseId);
  const lessons = (await Promise.all(modules.map(m => apiService.lessons.getByModule(m.idModule)))).flat();
  const activities = (await Promise.all(lessons.map(l => apiService.activities.getByLesson(l.idLesson)))).flat();
  return activities.sort(compareActivities);
}
