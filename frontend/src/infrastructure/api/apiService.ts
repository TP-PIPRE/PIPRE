import axiosInstance from "./axiosInstance";
import type { 
  UserRequestDTO, UserResponseDTO, RoleDTO, GroupDTO,
  CourseRequestDTO, CourseResponseDTO, ModuleRequestDTO, ModuleResponseDTO,
  LessonRequestDTO, LessonResponseDTO, ActivityRequestDTO, ActivityResponseDTO,
  ActivityResultRequest, ActivityResultResponse, RankingDTO,
  SimulationRequest, SimulationResponse, ModuleProgressRequest,
  HelpRequest, DropoutRiskResponse
} from "./models/apiModels";

export const apiService = {
  // PMV01 – Plataforma educativa base
  users: {
    create: async (data: UserRequestDTO) => {
      const response = await axiosInstance.post<{ id_user: string, message: string }>("/api/users", data);
      return response.data;
    },
    getById: async (id: string) => {
      const response = await axiosInstance.get<UserResponseDTO>(`/api/users/${id}`);
      return response.data;
    }
  },
  roles: {
    getAll: async () => {
      const response = await axiosInstance.get<RoleDTO[]>("/api/roles");
      return response.data;
    },
    assignToUser: async (data: { id_user: string, id_role: string }) => {
      await axiosInstance.post("/api/role/user", data);
    }
  },
  groups: {
    getAll: async () => {
      const response = await axiosInstance.get<GroupDTO[]>("/api/groups");
      return response.data;
    }
  },
  courses: {
    getAll: async () => {
      const response = await axiosInstance.get<CourseResponseDTO[]>("/api/courses");
      return response.data;
    },
    create: async (data: CourseRequestDTO) => {
      await axiosInstance.post("/api/courses", data);
    },
    update: async (data: CourseRequestDTO & { id_course: string }) => {
      await axiosInstance.put("/api/courses", data);
    },
    delete: async (id: string) => {
      await axiosInstance.delete(`/api/courses/${id}`);
    }
  },
  modules: {
    getByCourse: async (idCourse: string) => {
      const response = await axiosInstance.get<ModuleResponseDTO[]>(`/api/modules/course/${idCourse}`);
      return response.data;
    },
    create: async (data: ModuleRequestDTO) => {
      await axiosInstance.post("/api/modules", data);
    }
  },
  lessons: {
    getByModule: async (idModule: string) => {
      const response = await axiosInstance.get<LessonResponseDTO[]>(`/api/lessons/module/${idModule}`);
      return response.data;
    },
    create: async (data: LessonRequestDTO) => {
      await axiosInstance.post("/api/lessons", data);
    }
  },
  activities: {
    getByLesson: async (idLesson: string) => {
      const response = await axiosInstance.get<ActivityResponseDTO[]>(`/api/activities/lesson/${idLesson}`);
      return response.data;
    },
    create: async (data: ActivityRequestDTO) => {
      await axiosInstance.post("/api/activities", data);
    }
  },

  // PMV02 – Gamificación y ranking
  results: {
    postResult: async (data: ActivityResultRequest) => {
      await axiosInstance.post("/api/activity-results", data);
    },
    getByUser: async (idStudent: string) => {
      const response = await axiosInstance.get<ActivityResultResponse[]>(`/api/activity-results/user/${idStudent}`);
      return response.data;
    }
  },
  ranking: {
    getGroupRanking: async (idGroup: string) => {
      const response = await axiosInstance.get<RankingDTO[]>(`/api/group-students/${idGroup}`);
      return response.data;
    },
    addToGroup: async (data: { id_group: string, id_student: string }) => {
      await axiosInstance.post("/api/group-students", data);
    }
  },
  simulations: {
    postResult: async (data: SimulationRequest) => {
      await axiosInstance.post("/api/simulations", data);
    },
    getByUser: async (idStudent: string) => {
      const response = await axiosInstance.get<SimulationResponse[]>(`/api/simulations/user/${idStudent}`);
      return response.data;
    }
  },

  // PMV03 – Analítica inteligente
  analytics: {
    postProgress: async (data: ModuleProgressRequest) => {
      await axiosInstance.post("/api/module-progress", data);
    },
    getProgressByUser: async (idStudent: string) => {
      const response = await axiosInstance.get<{ id_module: string, percentage: number }[]>(`/api/module-progress/user/${idStudent}`);
      return response.data;
    },
    postHelpRequest: async (data: HelpRequest) => {
      await axiosInstance.post("/api/help-requests", data);
    },
    getHelpRequests: async (idStudent: string) => {
      const response = await axiosInstance.get<{ times_requested: number }[]>(`/api/help-requests/${idStudent}`);
      return response.data;
    },
    getDropoutRisk: async (idStudent: string) => {
      const response = await axiosInstance.get<DropoutRiskResponse>(`/api/dropout-risk/${idStudent}`);
      return response.data;
    }
  }
};

