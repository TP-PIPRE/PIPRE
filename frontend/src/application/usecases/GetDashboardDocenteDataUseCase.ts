import { getDashboardDocenteData } from "../../infrastructure/adapters/http/DashboardDocenteApiAdapter";
import type { DashboardDocenteData } from "../../domain/models/DashboardDocente";

export class GetDashboardDocenteDataUseCase {
  async execute(): Promise<DashboardDocenteData> {
    return getDashboardDocenteData();
  }
}
