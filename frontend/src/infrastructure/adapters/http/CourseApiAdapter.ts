import axiosInstance from "../../api/axiosInstance";
import { API_ENDPOINTS } from "../../api/endpoints";
import type { Course } from "../../../domain/models/Course";
import type { Module } from "../../../domain/models/Module";

export const getCourses = async (): Promise<Course[]> => {
  const response = await axiosInstance.get(API_ENDPOINTS.COURSES);
  return response.data;
};

export const getModulesByCourse = async (
  courseId: string,
): Promise<Module[]> => {
  const response = await axiosInstance.get(API_ENDPOINTS.MODULES(courseId));
  return response.data;
};
