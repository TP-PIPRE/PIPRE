export const API_ENDPOINTS = {
  USERS: "/api/users",
  COURSES: "/api/courses",
  MODULES: (courseId: string) => `/api/modules/course/${courseId}`,
  LESSONS: (moduleId: string) => `/api/lessons/module/${moduleId}`,
  ACTIVITIES: (lessonId: string) => `/api/activities/lesson/${lessonId}`,
  ACTIVITY_RESULTS: "/api/activity-results",
  SIMULATIONS: "/api/simulations",
};
