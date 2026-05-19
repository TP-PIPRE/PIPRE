import axiosInstance from "../../api/axiosInstance";
import { API_ENDPOINTS } from "../../api/endpoints";
import type { Challenge } from "../../../shared/types/Challenge";

export const getChallengesByCourse = async (
  courseId: string,
): Promise<Challenge[]> => {
  const response = await axiosInstance.get(
    API_ENDPOINTS.CHALLENGES_BY_COURSE(courseId),
  );
  return response.data;
};

export const createChallenge = async (
  data: Omit<Challenge, "id">,
): Promise<Challenge> => {
  const response = await axiosInstance.post(API_ENDPOINTS.CHALLENGES, data);
  return response.data;
};

export const updateChallenge = async (
  id: string,
  data: Partial<Challenge>,
): Promise<Challenge> => {
  const response = await axiosInstance.put(
    API_ENDPOINTS.CHALLENGE_BY_ID(id),
    data,
  );
  return response.data;
};

export const deleteChallenge = async (id: string): Promise<void> => {
  await axiosInstance.delete(API_ENDPOINTS.CHALLENGE_BY_ID(id));
};
