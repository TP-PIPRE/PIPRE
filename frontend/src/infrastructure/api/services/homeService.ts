// frontend/src/infrastructure/api/services/homeService.ts
import axiosInstance from "../axiosInstance";
import { API_ENDPOINTS } from "../endpoints";
import type { HomeResponseDTO } from "../models/apiModels";

export const homeService = {
  checkStatus: async (): Promise<HomeResponseDTO> => {
    const response = await axiosInstance.get<HomeResponseDTO>(API_ENDPOINTS.HOME);
    return response.data;
  },
};
