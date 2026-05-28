import axiosInstance from "./axiosInstance";
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
  ActivityRequestDTO,
  ActivityResponseDTO,
  ActivityResultRequest,
  ActivityResultResponse,
  RankingDTO,
  SimulationRequest,
  SimulationResponse,
  ModuleProgressRequest,
  HelpRequest,
  DropoutRiskResponse,
  ChallengeRequestDTO,
  ChallengeResponseDTO,
  ResultadoRequestDTO,
  ResultadoResponseDTO,
  RankingEntryDTO,
} from "./models/apiModels";

export const apiService = {
  // PMV01 – Plataforma educativa base
  users: {
    create: async (data: UserRequestDTO) => {
      const response = await axiosInstance.post<{
        id_user: string;
        message: string;
      }>("users", data);
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
    assignToUser: async (data: { id_user: string; id_role: string }) => {
      await axiosInstance.post("role/user", data);
    },
  },
  groups: {
    getAll: async () => {
      const response = await axiosInstance.get<GroupDTO[]>("groups");
      return response.data;
    },
  },
  courses: {
    getAll: async () => {
      const response = await axiosInstance.get<CourseResponseDTO[]>("courses");
      return response.data;
    },
    create: async (data: CourseRequestDTO) => {
      await axiosInstance.post("courses", data);
    },
    update: async (data: CourseRequestDTO & { id_course: string }) => {
      await axiosInstance.put("courses", data);
    },
    delete: async (id: string) => {
      await axiosInstance.delete(`courses/${id}`);
    },
  },
  modules: {
    getByCourse: async (idCourse: string) => {
      const response = await axiosInstance.get<ModuleResponseDTO[]>(
        `modules/course/${idCourse}`,
      );
      return response.data;
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
    getByLesson: async (idLesson: string) => {
      const response = await axiosInstance.get<ActivityResponseDTO[]>(
        `activities/lesson/${idLesson}`,
      );
      return response.data;
    },
    create: async (data: ActivityRequestDTO) => {
      await axiosInstance.post("activities", data);
    },
  },

  // PMV02 – Gamificación y ranking
  results: {
    postResult: async (data: ActivityResultRequest) => {
      await axiosInstance.post("activity-results", data);
    },
    getByUser: async (idStudent: string) => {
      const response = await axiosInstance.get<ActivityResultResponse[]>(
        `activity-results/user/${idStudent}`,
      );
      return response.data;
    },
  },
  simulations: {
    postResult: async (data: SimulationRequest) => {
      await axiosInstance.post("simulations", data);
    },
    getByUser: async (idStudent: string) => {
      const response = await axiosInstance.get<SimulationResponse[]>(
        `simulations/user/${idStudent}`,
      );
      return response.data;
    },
  },

  // PMV02.5 – Resultados de Retos y Ranking
  resultados: {
    save: async (data: ResultadoRequestDTO) => {
      const response = await axiosInstance.post<ResultadoResponseDTO>("resultados", data);
      return response.data;
    },
    getByStudent: async (studentId: string) => {
      const response = await axiosInstance.get<ResultadoResponseDTO[]>(`resultados/estudiante/${studentId}`);
      return response.data;
    },
    getByCourse: async (courseId: string) => {
      const response = await axiosInstance.get<ResultadoResponseDTO[]>(`resultados/curso/${courseId}`);
      return response.data;
    },
  },
  ranking: {
    getCourseRanking: async (courseId: string) => {
      const response = await axiosInstance.get<RankingEntryDTO[]>(`ranking/curso/${courseId}`);
      return response.data;
    },
    getGlobalRanking: async () => {
      const response = await axiosInstance.get<RankingEntryDTO[]>("ranking/global");
      return response.data;
    },
    getGroupRanking: async (idGroup: string) => {
      const response = await axiosInstance.get<RankingDTO[]>(
        `group-students/${idGroup}`,
      );
      return response.data;
    },
    addToGroup: async (data: { id_group: string; id_student: string }) => {
      await axiosInstance.post("group-students", data);
    },
  },

  // PMV03 – Analítica inteligente
  analytics: {
    postProgress: async (data: ModuleProgressRequest) => {
      await axiosInstance.post("module-progress", data);
    },
    getProgressByUser: async (idStudent: string) => {
      const response = await axiosInstance.get<
        { id_module: string; percentage: number }[]
      >(`module-progress/user/${idStudent}`);
      return response.data;
    },
    postHelpRequest: async (data: HelpRequest) => {
      await axiosInstance.post("help-requests", data);
    },
    getHelpRequests: async (idStudent: string) => {
      const response = await axiosInstance.get<{ times_requested: number }[]>(
        `help-requests/${idStudent}`,
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
  challenges: {
    getByCourse: async (courseId: string) => {
      const response = await axiosInstance.get<ChallengeResponseDTO[]>(
        `challenges/course/${courseId}`,
      );
      return response.data;
    },
    create: async (data: ChallengeRequestDTO) => {
      await axiosInstance.post("challenges", data);
    },
    update: async (id: string, data: Partial<ChallengeRequestDTO>) => {
      await axiosInstance.put(`challenges/${id}`, data);
    },
    delete: async (id: string) => {
      await axiosInstance.delete(`challenges/${id}`);
    },
  },
};
