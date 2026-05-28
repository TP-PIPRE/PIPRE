// frontend/src/infrastructure/api/services/courseService.ts
import axiosInstance from "../axiosInstance";
import { API_ENDPOINTS } from "../endpoints";
import type { CourseRequestDTO, CourseResponseDTO } from "../models/apiModels";

export const courseService = {
  getAll: async (): Promise<CourseResponseDTO[]> => {
    const response = await axiosInstance.get<CourseResponseDTO[]>(API_ENDPOINTS.COURSES);
    return response.data;
  },

  create: async (data: CourseRequestDTO): Promise<void> => {
    await axiosInstance.post(API_ENDPOINTS.COURSES, data);
  },

  update: async (id: string, data: CourseRequestDTO): Promise<void> => {
    await axiosInstance.put(API_ENDPOINTS.COURSE_BY_ID(id), null, {
      params: data, // Based on OAS, requestDTO is a query parameter for PUT
    });
  },
};
