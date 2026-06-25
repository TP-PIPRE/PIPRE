import axiosInstance from "./axiosInstance";
import { API_ENDPOINTS } from "./endpoints";
import type {
  UserRequestDTO,
  UserResponseDTO,
  RoleDTO,
  GroupDTO,
  CourseRequestDTO,
  ModuleRequestDTO,
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
      const response = await axiosInstance.post<string>(API_ENDPOINTS.USERS, data);
      return response.data;
    },
    getById: async (id: string) => {
      const response = await axiosInstance.get<UserResponseDTO>(API_ENDPOINTS.USER_BY_ID(id));
      return response.data;
    },
  },
  roles: {
    getAll: async () => {
      const response = await axiosInstance.get<RoleDTO[]>(API_ENDPOINTS.ROLES);
      return response.data;
    },
    assignToUser: async (data: { idUser: string; idRole: string }) => {
      await axiosInstance.post(API_ENDPOINTS.ROLES_USER, {
        idUser: data.idUser,
        idRole: data.idRole,
      });
    },
  },
  groups: {
    getAll: async () => {
      const response = await axiosInstance.get<GroupDTO[]>(API_ENDPOINTS.GROUPS);
      return response.data;
    },
    getById: async (id: string) => {
      const response = await axiosInstance.get<GroupDTO>(API_ENDPOINTS.GROUP_BY_ID(id));
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
        API_ENDPOINTS.MODULES_BY_COURSE(idCourse), { params },
      );
      return response.data.content;
    },
    create: async (data: ModuleRequestDTO) => {
      await axiosInstance.post(API_ENDPOINTS.MODULES, data);
    },
  },
  lessons: {
    getByModule: async (idModule: string) => {
      const response = await axiosInstance.get<LessonResponseDTO[]>(
        API_ENDPOINTS.LESSONS_BY_MODULE(idModule),
      );
      return response.data;
    },
    create: async (data: LessonRequestDTO) => {
      await axiosInstance.post(API_ENDPOINTS.LESSONS, data);
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
    getById: async (id: string) => {
      const response = await axiosInstance.get<ActivityResponseDTO>(API_ENDPOINTS.ACTIVITY_BY_ID(id));
      return response.data;
    },
    create: async (data: CreateActivityCommand) => {
      const response = await axiosInstance.post<{ idActivity: string }>(
        API_ENDPOINTS.ACTIVITIES,
        data,
      );
      return response.data;
    },
    update: async (id: string, data: CreateActivityCommand) => {
      await axiosInstance.put(API_ENDPOINTS.ACTIVITY_BY_ID(id), data);
    },
    delete: async (id: string) => {
      await axiosInstance.delete(API_ENDPOINTS.ACTIVITY_BY_ID(id));
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
        API_ENDPOINTS.GROUP_STUDENTS_BY_ID(idGroup),
      );
      return response.data;
    },
    addToGroup: async (data: { idGroup: string; idStudent: string }) => {
      await axiosInstance.post(API_ENDPOINTS.GROUP_STUDENTS, data);
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
      await axiosInstance.post(API_ENDPOINTS.MODULE_PROGRESS, data);
    },
    getProgressByUser: async (idStudent: string) => {
      const response = await axiosInstance.get<
        { idModule: string; percentage: number }[]
      >(API_ENDPOINTS.MODULE_PROGRESS_BY_USER(idStudent));
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
        API_ENDPOINTS.DROPOUT_RISK_BY_USER(idStudent),
      );
      return response.data;
    },
  },
};
