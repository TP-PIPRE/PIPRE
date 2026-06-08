export const API_ENDPOINTS = {
  HOME: "/",

  USERS: "/users",
  USER_BY_ID: (id: string) => `/users/${id}`,

  AUTH_LOGIN: "/auth/login",

  COURSES: "/courses",
  COURSE_BY_ID: (id: string) => `/courses/${id}`,
  MODULES: (courseId: string) => `/courses/${courseId}/modules`,

  LESSONS: "/lesson",
  LESSON_BY_ID: (id: string) => `/lesson/${id}`,

  ACTIVITIES: "/activities",
  ACTIVITIES_BY_LESSON: (idLesson: string) => `/activities/lesson/${idLesson}`,

  SIMULATIONS: "/simulations",
  SIMULATIONS_BY_USER: (idStudent: string) => `/simulations/user/${idStudent}`,

  ACTIVITY_RESULTS: "/activity-results",
  ACTIVITY_RESULTS_BY_USER: (idStudent: string) => `/activity-results/user/${idStudent}`,

  GROUPS: "/groups",
  GROUP_STUDENTS: (idGroup: string) => `/group-students/${idGroup}`,

  PERFORMANCE_RATING: "/performance/rating",

  MODULE_PROGRESS: "/module-progress",
  MODULE_PROGRESS_BY_USER: (idStudent: string) => `/module-progress/user/${idStudent}`,

  HELP_REQUESTS: "/help-requests",
  HELP_REQUESTS_BY_USER: (idStudent: string) => `/help-requests/${idStudent}`,

  ROLES: "/roles",
  ROLES_USER: "/roles/user",
};
