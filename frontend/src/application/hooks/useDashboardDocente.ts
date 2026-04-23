import { useState, useEffect } from "react";
import { GetDashboardDocenteDataUseCase } from "../usecases/GetDashboardDocenteDataUseCase";
import type { DashboardDocenteData } from "../../domain/models/DashboardDocente";

export const useDashboardDocente = () => {
  const [dashboardData, setDashboardData] =
    useState<DashboardDocenteData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getDashboardDocenteDataUseCase = new GetDashboardDocenteDataUseCase();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getDashboardDocenteDataUseCase.execute();
        setDashboardData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { dashboardData, loading, error };
};
