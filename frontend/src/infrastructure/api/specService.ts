import axiosInstance, { aiAxiosInstance } from "./axiosInstance";
import { AI_ENDPOINTS } from "./aiEndpoints";
import type {
  GroupInfo,
  RoboticsSimulationRequest,
  RoboticsSimulationResponse,
  ActivityResultRequest,
  ActivityResultResponse,
  CodeFeedbackAnalyzeResponse,
  PSeIntGenerateResponse,
} from "../../shared/types/SpecContracts";

export const specService = {
  groups: {
    getAll: async (): Promise<GroupInfo[]> => {
      const response = await axiosInstance.get<GroupInfo[]>("groups");
      return response.data;
    },
  },

  roboticsSimulations: {
    create: async (
      data: RoboticsSimulationRequest,
    ): Promise<RoboticsSimulationResponse | void> => {
      const response = await axiosInstance.post<
        RoboticsSimulationResponse | void
      >("simulations", data);
      return response.data;
    },
    getByUser: async (
      idStudent: string,
    ): Promise<RoboticsSimulationResponse[]> => {
      const response = await axiosInstance.get<RoboticsSimulationResponse[]>(
        `simulations/user/${idStudent}`,
      );
      return response.data;
    },
  },

  activityResults: {
    create: async (data: ActivityResultRequest): Promise<void> => {
      await axiosInstance.post("activity-results", data);
    },
    getByUser: async (
      idStudent: string,
    ): Promise<ActivityResultResponse[]> => {
      const response = await axiosInstance.get<ActivityResultResponse[]>(
        `activity-results/user/${idStudent}`,
      );
      return response.data;
    },
  },

  ai: {
    analyzeCode: async (): Promise<CodeFeedbackAnalyzeResponse> => {
      const response = await aiAxiosInstance.post<CodeFeedbackAnalyzeResponse>(
        AI_ENDPOINTS.CODE_FEEDBACK_ANALYZE,
        {},
      );
      return response.data;
    },
    generatePSeInt: async (): Promise<PSeIntGenerateResponse> => {
      const response = await aiAxiosInstance.post<PSeIntGenerateResponse>(
        AI_ENDPOINTS.RIA12_PSEINT,
        {},
      );
      return response.data;
    },
  },
};
