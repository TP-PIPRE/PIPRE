import axiosInstance from "../../api/axiosInstance";
import type { DashboardDocenteData } from "../../../shared/types/DashboardDocente";

export const getDashboardDocenteData =
  async (): Promise<DashboardDocenteData> => {
    try {
      const response = await axiosInstance.get<DashboardDocenteData>("/docente/dashboard");
      return response.data;
    } catch (error) {
      console.error("Error en getDashboardDocenteData:", error);
      throw error;
    }
  };
