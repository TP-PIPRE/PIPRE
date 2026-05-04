export const API_ENDPOINTS = {
  // Base endpoints
  HOME: "/",

  // User endpoints
  USERS: "/api/v1/users",

  // Course endpoints
  COURSES: "/api/v1/courses",
  COURSE_BY_ID: (id: string) => `/api/v1/courses/${id}`,
  MODULES: (courseId: string) => `/api/v1/courses/${courseId}/modules`,

  // Lesson endpoints
  LESSONS: "/api/v1/lesson",
  LESSON_BY_ID: (id: string) => `/api/v1/lesson/${id}`,
};
