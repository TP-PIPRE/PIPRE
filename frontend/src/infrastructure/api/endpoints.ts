export const API_ENDPOINTS = {
  // Base endpoints
  HOME: "/",
  
  // User endpoints
  USERS: "/api/v1/users",
  
  // Course endpoints
  COURSES: "/api/v1/courses",
  COURSE_BY_ID: (id: string) => `/api/v1/courses/${id}`,
  
  // Lesson endpoints
  LESSONS: "/api/v1/lesson",
  LESSON_BY_ID: (id: string) => `/api/v1/lesson/${id}`,
};
