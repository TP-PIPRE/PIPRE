import type { DashboardDocenteData } from "../../../domain/models/DashboardDocente";

const API_URL = "https://api.pipre.com"; // URL de tu API

export const getDashboardDocenteData =
  async (): Promise<DashboardDocenteData> => {
    try {
      const response = await fetch(`${API_URL}/docente/dashboard`);
      if (!response.ok) {
        throw new Error("Error al cargar los datos del dashboard");
      }
      return response.json();
    } catch (error) {
      console.error("Error en getDashboardDocenteData:", error);
      throw error;
    }
  };
