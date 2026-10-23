import type { User } from "../../../shared/types/User";
import type { LoginResponseDTO } from "../../api/models/apiModels";
import type { IAuthRepository } from "../../ports/IAuthRepository";
import axiosInstance from "../../api/axiosInstance";
import { getApiErrorMessage } from "../../api/errors";

export class AuthAdapter implements IAuthRepository {
  async login(email: string, password: string): Promise<{ user: User }> {
    try {
      const { data } = await axiosInstance.post<LoginResponseDTO>("auth/login", { email, password });
      const source = data.user;
      const role = source?.role?.toLowerCase() === "teacher" ? "docente" : source?.role?.toLowerCase();
      if (!role || !source?.idUser || !source.email || !["student", "docente", "admin"].includes(role ?? "")) {
        throw new Error("La respuesta de inicio de sesión está incompleta.");
      }
      // The browser owns the HttpOnly JWT. Roles come only from the server response.
      return { user: { id: source.idUser, email: source.email, name: source.firstName, role } };
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "No se pudo iniciar sesión."));
    }
  }
  async register(name: string, lastname: string, email: string, password: string, age: number, grade: string): Promise<User> {
    try {
      await axiosInstance.post<string>("users", { firstName: name, lastName: lastname, email, passwordHash: password, age, grade, roleIdList: [] });
      return (await this.login(email, password)).user;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "No se pudo registrar la cuenta."));
    }
  }
  async logout(): Promise<void> { await axiosInstance.post("auth/logout"); }
}
