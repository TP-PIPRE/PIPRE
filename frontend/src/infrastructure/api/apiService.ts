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
  PlayerProfileDTO,
  AchievementDTO,
  StudentHistoryDTO,
  CourseResponseDTO,
  ModuleResponseDTO,
  ModuleProgressDTO,
  HelpRequestDTO,
  PageDTO,
  Pageable,
  TetriLogicTemplateResponseDTO,
  NeonFlowTemplateResponseDTO,
} from "./models/apiModels";

async function readCollection<T>(path: string, pageable?: Pageable): Promise<T[]> {
  const params = { page: pageable?.page ?? 0, size: pageable?.size ?? 100, ...(pageable?.sort ? { sort: pageable.sort } : {}) };
  const { data } = await axiosInstance.get<PageDTO<T>>(path, { params });
  if (!Array.isArray(data.content)) throw new Error("Respuesta paginada inválida.");
  const items = [...data.content];
  if (!pageable) {
    for (let page = data.number + 1; page < data.totalPages; page++) {
      const next = await axiosInstance.get<PageDTO<T>>(path, { params: { ...params, page } });
      items.push(...next.data.content);
    }
  }
  return items;
}

export const apiService = {
  neonflow: {
    getTemplate: async (id:string, signal?:AbortSignal) => (await axiosInstance.get<NeonFlowTemplateResponseDTO>(`neonflow/templates/${encodeURIComponent(id)}`,{signal})).data,
  },
  tetrilogic: {
    getTemplate: async (templateId: string, signal?: AbortSignal) => {
      const response = await axiosInstance.get<TetriLogicTemplateResponseDTO>(
        `tetrilogic/templates/${encodeURIComponent(templateId)}`, { signal },
      );
      return response.data;
    },
  },
  users: {
    getAll: async () => {
      const response = await axiosInstance.get<UserResponseDTO[]>(API_ENDPOINTS.USERS);
      return response.data;
    },
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
      return readCollection<CourseResponseDTO>(API_ENDPOINTS.COURSES, pageable);
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
      return readCollection<ModuleResponseDTO>(API_ENDPOINTS.MODULES_BY_COURSE(idCourse), pageable);
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
      return readCollection<ActivityResponseDTO>(API_ENDPOINTS.ACTIVITIES_BY_LESSON(idLesson), pageable);
    },
    getById: async (id: string) => {
      const response = await axiosInstance.get<ActivityResponseDTO>(API_ENDPOINTS.ACTIVITY_BY_ID(id));
      return response.data;
    },
    create: async (data: CreateActivityCommand) => {
      await axiosInstance.post<void>(
        API_ENDPOINTS.ACTIVITIES,
        data,
      );
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
    getCourseRanking: async (courseId: string) => {
      const response = await axiosInstance.get<RankingDTO[]>(
        API_ENDPOINTS.RANKING_COURSE(courseId),
      );
      return response.data;
    },
    getModuleRanking: async (moduleId: string) => {
      const response = await axiosInstance.get<RankingDTO[]>(
        API_ENDPOINTS.RANKING_MODULE(moduleId),
      );
      return response.data;
    },
    addToGroup: async (data: { idGroup: string; idStudent: string }) => {
      await axiosInstance.post(API_ENDPOINTS.GROUP_STUDENTS, data);
    },
    removeFromGroup: async (idGroup: string, idStudent: string) => {
      await axiosInstance.delete(`${API_ENDPOINTS.GROUP_STUDENTS}/${idGroup}/${idStudent}`);
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
      const response = await axiosInstance.get<ModuleProgressDTO[]>(API_ENDPOINTS.MODULE_PROGRESS_BY_USER(idStudent));
      return response.data;
    },
    postHelpRequest: async (data: HelpRequest) => {
      await axiosInstance.post(API_ENDPOINTS.HELP_REQUESTS, data);
    },
    getHelpRequests: async (idStudent: string) => {
      const response = await axiosInstance.get<HelpRequestDTO[]>(
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
  profile: {
    get: async (idStudent: string) => {
      const response = await axiosInstance.get<PlayerProfileDTO>(
        API_ENDPOINTS.PROFILE(idStudent),
      );
      return response.data;
    },
    getAchievements: async (idStudent: string) => {
      const response = await axiosInstance.get<AchievementDTO[]>(
        API_ENDPOINTS.PROFILE_ACHIEVEMENTS(idStudent),
      );
      return response.data;
    },
    getHistory: async (idStudent: string) => {
      const response = await axiosInstance.get<StudentHistoryDTO[]>(
        API_ENDPOINTS.PROFILE_HISTORY(idStudent),
      );
      return response.data;
    },
  },
};
