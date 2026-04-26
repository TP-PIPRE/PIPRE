// frontend/src/infrastructure/api/services/userService.ts
import axiosInstance from "../axiosInstance";
import { API_ENDPOINTS } from "../endpoints";
import type { UserRequestDTO } from "../models/apiModels";

export const userService = {
  create: async (data: UserRequestDTO): Promise<string> => {
    const response = await axiosInstance.post<string>(API_ENDPOINTS.USERS, null, {
      params: data, // Based on OAS, requestDTO is a query parameter for POST
    });
    return response.data;
  },
};
