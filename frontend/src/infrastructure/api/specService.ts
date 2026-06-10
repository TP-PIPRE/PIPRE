import axiosInstance, { aiAxiosInstance } from "./axiosInstance";
import { AI_ENDPOINTS } from "./aiEndpoints";
import type {
  GroupInfo,
  ActivityResponse,
  RoboticsSimulationRequest,
  RoboticsSimulationResponse,
  ActivityResultRequest,
  ActivityResultResponse,
  CodeFeedbackAnalyzeResponse,
  PSeIntGenerateRequest,
  PSeIntGenerateResponse,
} from "../../shared/types/SpecContracts";

export const specService = {
  groups: {
    getAll: async (): Promise<GroupInfo[]> => {
      const response = await axiosInstance.get<GroupInfo[]>("groups");
      return response.data;
    },
    getActivities: async (groupId: string): Promise<ActivityResponse[]> => {
      const response = await axiosInstance.get<ActivityResponse[]>(
        `groups/${groupId}/activities`,
      );
      return response.data;
    },
  },

  activities: {
    getById: async (id: string): Promise<ActivityResponse> => {
      const response = await axiosInstance.get<ActivityResponse>(
        `activities/${id}`,
      );
      return response.data;
    },
  },

  roboticsSimulations: {
    create: async (
      data: RoboticsSimulationRequest,
    ): Promise<RoboticsSimulationResponse> => {
      const response = await axiosInstance.post<RoboticsSimulationResponse>(
        "robotics-simulations",
        data,
      );
      return response.data;
    },
    getById: async (id: string): Promise<RoboticsSimulationResponse> => {
      const response = await axiosInstance.get<RoboticsSimulationResponse>(
        `robotics-simulations/${id}`,
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
    analyzeCode: async (data: {
      id_student: string;
      id_activity?: string;
      blockly_code: string;
      pseudocode: string;
      pseint_diagram?: string;
      ml_features: Record<string, unknown>;
      challenge_context: {
        title: string;
        description?: string;
        max_blocks: number;
        environment: string;
        difficulty?: string;
        missions?: unknown[];
        starting_position?: { x: number; z: number };
        target_position?: { x: number; z: number };
      };
    }): Promise<CodeFeedbackAnalyzeResponse> => {
      const response = await aiAxiosInstance.post<CodeFeedbackAnalyzeResponse>(
        AI_ENDPOINTS.CODE_FEEDBACK_ANALYZE,
        data,
      );
      return response.data;
    },
    generatePSeInt: async (
      data: PSeIntGenerateRequest,
    ): Promise<PSeIntGenerateResponse> => {
      const response = await aiAxiosInstance.post<PSeIntGenerateResponse>(
        AI_ENDPOINTS.RIA12_PSEINT,
        data,
      );
      return response.data;
    },
  },
};
