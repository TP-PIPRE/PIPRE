export const API_ENDPOINTS = {
  HOME: "/",

  USERS: "/users",
  USER_BY_ID: (id: string) => `/users/${id}`,

  AUTH_LOGIN: "/auth/login",

  COURSES: "/courses",
  COURSE_BY_ID: (id: string) => `/courses/${id}`,
  MODULES: "/modules",
  MODULES_BY_COURSE: (courseId: string) => `/modules/course/${courseId}`,

  LESSONS: "/lessons",
  LESSONS_BY_MODULE: (idModule: string) => `/lessons/module/${idModule}`,

  ACTIVITIES: "/activities",
  ACTIVITY_BY_ID: (id: string) => `/activities/${id}`,
  ACTIVITIES_BY_LESSON: (idLesson: string) => `/activities/lesson/${idLesson}`,

  SIMULATIONS: "/simulations",
  SIMULATIONS_BY_USER: (idStudent: string) => `/simulations/user/${idStudent}`,

  ACTIVITY_RESULTS: "/activity-results",
  ACTIVITY_RESULTS_BY_USER: (idStudent: string) => `/activity-results/user/${idStudent}`,

  GROUPS: "/groups",
  GROUP_BY_ID: (idGroup: string) => `/groups/${idGroup}`,
  GROUP_STUDENTS: "/group-students",
  GROUP_STUDENTS_BY_ID: (idGroup: string) => `/group-students/${idGroup}`,

  PERFORMANCE_RATING: "/performance/rating",

  MODULE_PROGRESS: "/module-progress",
  MODULE_PROGRESS_BY_USER: (idStudent: string) => `/module-progress/user/${idStudent}`,

  HELP_REQUESTS: "/help-requests",
  HELP_REQUESTS_BY_USER: (idStudent: string) => `/help-requests/${idStudent}`,

  DROPOUT_RISK_BY_USER: (idStudent: string) => `/dropout-risk/${idStudent}`,

  ROLES: "/roles",
  ROLES_USER: "/roles/user",
};
