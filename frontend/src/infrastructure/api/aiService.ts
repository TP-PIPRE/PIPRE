import { aiAxiosInstance } from "./axiosInstance";
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
  Ria10PedagogicalRequest,
  Ria10PedagogicalResponse,
  Ria11TimeRequest,
  Ria11TimeResponse,
  RiaInfoResponse,
  HealthResponse,
  CodeFeedbackRequest,
  CodeFeedbackResponse,
  PSeIntGenerateRequest,
  PSeIntGenerateResponse,
  AggregatedFeaturesResponse,
} from "./models/aiModels";

export const aiService = {
  predict: async (data: Ria01PredictRequest) => {
    const response = await aiAxiosInstance.post<Ria01PredictResponse>(
      AI_ENDPOINTS.RIA01_PREDICT,
      data,
    );
    return response.data;
  },

  recommend: async (data: Ria03RecommendRequest) => {
    const response = await aiAxiosInstance.post<Ria03RecommendResponse>(
      AI_ENDPOINTS.RIA03_RECOMMEND,
      data,
    );
    return response.data;
  },

  difficulty: async (data: Ria04DifficultyRequest) => {
    const response = await aiAxiosInstance.post<Ria04DifficultyResponse>(
      AI_ENDPOINTS.RIA04_DIFFICULTY,
      data,
    );
    return response.data;
  },

  anomaly: async (data: Ria08AnomalyRequest) => {
    const response = await aiAxiosInstance.post<Ria08AnomalyResponse>(
      AI_ENDPOINTS.RIA08_ANOMALY,
      data,
    );
    return response.data;
  },

  timePrediction: async (data: Ria11TimeRequest) => {
    const response = await aiAxiosInstance.post<Ria11TimeResponse>(
      AI_ENDPOINTS.RIA11_TIME,
      data,
    );
    return response.data;
  },

  pedagogical: async (data: Ria10PedagogicalRequest) => {
    const response = await aiAxiosInstance.post<Ria10PedagogicalResponse>(
      AI_ENDPOINTS.RIA10_PEDAGOGICAL,
      data,
    );
    return response.data;
  },

  getInfo: async (endpoint: string) => {
    const response = await aiAxiosInstance.get<RiaInfoResponse>(endpoint);
    return response.data;
  },

  health: async () => {
    const response = await aiAxiosInstance.get<HealthResponse>(
      AI_ENDPOINTS.HEALTH,
    );
    return response.data;
  },

  analyzeCode: async (data: CodeFeedbackRequest) => {
    const response = await aiAxiosInstance.post<CodeFeedbackResponse>(
      AI_ENDPOINTS.CODE_FEEDBACK_ANALYZE,
      data,
    );
    return response.data;
  },

  generatePSeInt: async (data: PSeIntGenerateRequest) => {
    const response = await aiAxiosInstance.post<PSeIntGenerateResponse>(
      AI_ENDPOINTS.RIA12_PSEINT,
      data,
    );
    return response.data;
  },

  getFeaturesByGroup: async (idGroup: string) => {
    const response = await aiAxiosInstance.get<AggregatedFeaturesResponse[]>(
      AI_ENDPOINTS.FEATURES_AGGREGATE_GROUP(idGroup),
    );
    return response.data;
  },

  getFeaturesByStudent: async (idStudent: string) => {
    const response = await aiAxiosInstance.get<AggregatedFeaturesResponse>(
      AI_ENDPOINTS.FEATURES_AGGREGATE_STUDENT(idStudent),
    );
    return response.data;
  },

  predictRia01: async (data: Ria01PredictRequest) => aiService.predict(data),
  recommendRia03: async (data: Ria03RecommendRequest) => aiService.recommend(data),
  adjustDifficultyRia04: async (data: Ria04DifficultyRequest) => aiService.difficulty(data),
  detectAnomalyRia08: async (data: Ria08AnomalyRequest) => aiService.anomaly(data),
  recommendPedagogicalRia10: async (data: Ria10PedagogicalRequest) => aiService.pedagogical(data),
  classifyTimeRia11: async (data: Ria11TimeRequest) => aiService.timePrediction(data),

  getRia01Info: async () => aiService.getInfo(AI_ENDPOINTS.RIA01_INFO),
  getRia03Info: async () => aiService.getInfo(AI_ENDPOINTS.RIA03_INFO),
  getRia04Info: async () => aiService.getInfo(AI_ENDPOINTS.RIA04_INFO),
  getRia08Info: async () => aiService.getInfo(AI_ENDPOINTS.RIA08_INFO),
  getRia10Info: async () => aiService.getInfo(AI_ENDPOINTS.RIA10_INFO),
  getRia11Info: async () => aiService.getInfo(AI_ENDPOINTS.RIA11_INFO),
};
