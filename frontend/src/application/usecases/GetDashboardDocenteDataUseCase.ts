import { getDashboardDocenteData } from "../../infrastructure/adapters/http/DashboardDocenteApiAdapter";
import type { DashboardDocenteData } from "../../shared/types/DashboardDocente";

export class GetDashboardDocenteDataUseCase {
  async execute(): Promise<DashboardDocenteData> {
    return getDashboardDocenteData();
  }
}
