import aiAxiosInstance from "./aiAxiosInstance";
import { AI_ENDPOINTS } from "./aiEndpoints";
import type {
  Ria01PredictRequest,
  Ria01PredictResponse,
  Ria03RecommendRequest,
  Ria03RecommendResponse,
  Ria04DifficultyRequest,
  Ria04DifficultyResponse,
  Ria08AnomalyRequest,
  Ria08AnomalyResponse,
  Ria11TimeRequest,
  Ria11TimeResponse,
  RiaInfoResponse,
  HealthResponse,
} from "./models/aiModels";

export const aiService = {
  predictRia01: async (data: Ria01PredictRequest) => {
    const response = await aiAxiosInstance.post<Ria01PredictResponse>(
      AI_ENDPOINTS.RIA01_PREDICT,
      data,
    );
    return response.data;
  },

  recommendRia03: async (data: Ria03RecommendRequest) => {
    const response = await aiAxiosInstance.post<Ria03RecommendResponse>(
      AI_ENDPOINTS.RIA03_RECOMMEND,
      data,
    );
    return response.data;
  },

  adjustDifficultyRia04: async (data: Ria04DifficultyRequest) => {
    const response = await aiAxiosInstance.post<Ria04DifficultyResponse>(
      AI_ENDPOINTS.RIA04_DIFFICULTY,
      data,
    );
    return response.data;
  },

  detectAnomalyRia08: async (data: Ria08AnomalyRequest) => {
    const response = await aiAxiosInstance.post<Ria08AnomalyResponse>(
      AI_ENDPOINTS.RIA08_ANOMALY,
      data,
    );
    return response.data;
  },

  classifyTimeRia11: async (data: Ria11TimeRequest) => {
    const response = await aiAxiosInstance.post<Ria11TimeResponse>(
      AI_ENDPOINTS.RIA11_TIME,
      data,
    );
    return response.data;
  },

  getRia01Info: async () => {
    const response = await aiAxiosInstance.get<RiaInfoResponse>(
      AI_ENDPOINTS.RIA01_INFO,
    );
    return response.data;
  },

  getRia03Info: async () => {
    const response = await aiAxiosInstance.get<RiaInfoResponse>(
      AI_ENDPOINTS.RIA03_INFO,
    );
    return response.data;
  },

  getRia04Info: async () => {
    const response = await aiAxiosInstance.get<RiaInfoResponse>(
      AI_ENDPOINTS.RIA04_INFO,
    );
    return response.data;
  },

  getRia08Info: async () => {
    const response = await aiAxiosInstance.get<RiaInfoResponse>(
      AI_ENDPOINTS.RIA08_INFO,
    );
    return response.data;
  },

  getRia11Info: async () => {
    const response = await aiAxiosInstance.get<RiaInfoResponse>(
      AI_ENDPOINTS.RIA11_INFO,
    );
    return response.data;
  },

  getHealth: async () => {
    const response = await aiAxiosInstance.get<HealthResponse>(
      AI_ENDPOINTS.HEALTH,
    );
    return response.data;
  },
};
