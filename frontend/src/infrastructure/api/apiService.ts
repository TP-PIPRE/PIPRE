import axiosInstance from "./axiosInstance";
import { API_ENDPOINTS } from "./endpoints";
import type {
  UserRequestDTO,
  UserResponseDTO,
  RoleDTO,
  GroupDTO,
  CourseRequestDTO,
  CourseResponseDTO,
  ModuleRequestDTO,
  ModuleResponseDTO,
  LessonRequestDTO,
  LessonResponseDTO,
  CreateActivityCommand,
  ActivityResponseDTO,
  ActivityResultRequest,
  ActivityResultResponse,
  RankingDTO,
  SimulationRequest,
  SimulationResponse,
  ModuleProgressRequest,
  HelpRequest,
  DropoutRiskResponse,
  PageCourseDTO,
  PageModuleDTO,
  PageActivityDTO,
  Pageable,
} from "./models/apiModels";

export const apiService = {
  users: {
    create: async (data: UserRequestDTO) => {
      const response = await axiosInstance.post<string>("users", data);
      return response.data;
    },
    getById: async (id: string) => {
      const response = await axiosInstance.get<UserResponseDTO>(`users/${id}`);
      return response.data;
    },
  },
  roles: {
    getAll: async () => {
      const response = await axiosInstance.get<RoleDTO[]>("roles");
      return response.data;
    },
    assignToUser: async (data: { idUser: string; idRole: string }) => {
      await axiosInstance.post("roles/user", {
        idUser: data.idUser,
        idRole: data.idRole,
      });
    },
  },
  groups: {
    getAll: async () => {
      const response = await axiosInstance.get<GroupDTO[]>(
        API_ENDPOINTS.GROUPS,
      );
      return response.data;
    },
  },
  courses: {
    getAll: async (pageable?: Pageable) => {
      const params = { page: pageable?.page ?? 0, size: pageable?.size ?? 100 };
      const response = await axiosInstance.get<PageCourseDTO>(API_ENDPOINTS.COURSES, { params });
      return response.data.content;
    },
    create: async (data: CourseRequestDTO) => {
      await axiosInstance.post(API_ENDPOINTS.COURSES, data);
    },
    update: async (data: CourseRequestDTO & { idCourse: string }) => {
      await axiosInstance.put(API_ENDPOINTS.COURSE_BY_ID(data.idCourse), data);
    },
    delete: async (id: string) => {
      await axiosInstance.delete(API_ENDPOINTS.COURSE_BY_ID(id));
    },
  },
  modules: {
    getByCourse: async (idCourse: string, pageable?: Pageable) => {
      const params = { page: pageable?.page ?? 0, size: pageable?.size ?? 100 };
      const response = await axiosInstance.get<PageModuleDTO>(
        `modules/course/${idCourse}`, { params },
      );
      return response.data.content;
    },
    create: async (data: ModuleRequestDTO) => {
      await axiosInstance.post("modules", data);
    },
  },
  lessons: {
    getByModule: async (idModule: string) => {
      const response = await axiosInstance.get<LessonResponseDTO[]>(
        `lessons/module/${idModule}`,
      );
      return response.data;
    },
    create: async (data: LessonRequestDTO) => {
      await axiosInstance.post("lessons", data);
    },
  },
  activities: {
    getByLesson: async (idLesson: string, pageable?: Pageable) => {
      const params = { page: pageable?.page ?? 0, size: pageable?.size ?? 100 };
      const response = await axiosInstance.get<PageActivityDTO>(
        API_ENDPOINTS.ACTIVITIES_BY_LESSON(idLesson), { params },
      );
      return response.data.content;
    },
    create: async (data: CreateActivityCommand) => {
      const response = await axiosInstance.post<{ idActivity: string }>(
        API_ENDPOINTS.ACTIVITIES,
        data,
      );
      return response.data;
    },
  },
  results: {
    postResult: async (data: ActivityResultRequest) => {
      await axiosInstance.post(API_ENDPOINTS.ACTIVITY_RESULTS, data);
    },
    getByUser: async (idStudent: string) => {
      const response = await axiosInstance.get<ActivityResultResponse[]>(
        API_ENDPOINTS.ACTIVITY_RESULTS_BY_USER(idStudent),
      );
      return response.data;
    },
  },
  simulations: {
    postResult: async (data: SimulationRequest) => {
      return axiosInstance.post(API_ENDPOINTS.SIMULATIONS, data);
    },
    getByUser: async (idStudent: string) => {
      const response = await axiosInstance.get<SimulationResponse[]>(
        API_ENDPOINTS.SIMULATIONS_BY_USER(idStudent),
      );
      return response.data;
    },
  },
  ranking: {
    getGroupRanking: async (idGroup: string) => {
      const response = await axiosInstance.get<RankingDTO[]>(
        API_ENDPOINTS.GROUP_STUDENTS(idGroup),
      );
      return response.data;
    },
    addToGroup: async (data: { idGroup: string; idStudent: string }) => {
      await axiosInstance.post("group-students", data);
    },
  },
  performance: {
    rating: async (data: { idActivity: string; idResult: string; idHelpRequest?: string }) => {
      const response = await axiosInstance.post<{
        result: string;
        accuracy: number;
        precision: number;
      }>(API_ENDPOINTS.PERFORMANCE_RATING, data);
      return response.data;
    },
  },
  analytics: {
    postProgress: async (data: ModuleProgressRequest) => {
      await axiosInstance.post("module-progress", data);
    },
    getProgressByUser: async (idStudent: string) => {
      const response = await axiosInstance.get<
        { idModule: string; percentage: number }[]
      >(`module-progress/user/${idStudent}`);
      return response.data;
    },
    postHelpRequest: async (data: HelpRequest) => {
      await axiosInstance.post(API_ENDPOINTS.HELP_REQUESTS, data);
    },
    getHelpRequests: async (idStudent: string) => {
      const response = await axiosInstance.get<{ timesRequested: number }[]>(
        API_ENDPOINTS.HELP_REQUESTS_BY_USER(idStudent),
      );
      return response.data;
    },
    getDropoutRisk: async (idStudent: string) => {
      const response = await axiosInstance.get<DropoutRiskResponse>(
        `dropout-risk/${idStudent}`,
      );
      return response.data;
    },
  },
};
