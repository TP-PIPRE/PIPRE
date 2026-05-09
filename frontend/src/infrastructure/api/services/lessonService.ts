// frontend/src/infrastructure/api/services/lessonService.ts
import axiosInstance from "../axiosInstance";
import { API_ENDPOINTS } from "../endpoints";
import type { LessonRequestDTO, LessonResponseDTO } from "../models/apiModels";

export const lessonService = {
  getAll: async (): Promise<LessonResponseDTO[]> => {
    const response = await axiosInstance.get<LessonResponseDTO[]>(API_ENDPOINTS.LESSONS);
    return response.data;
  },

  update: async (id: string, data: LessonRequestDTO): Promise<void> => {
    await axiosInstance.put(API_ENDPOINTS.LESSON_BY_ID(id), null, {
      params: data, // Based on OAS, requestDTO is a query parameter for PUT
    });
  },
};
