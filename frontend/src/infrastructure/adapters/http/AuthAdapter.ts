import axiosInstance from "../../api/axiosInstance";
import type { IAuthRepository } from "../../ports/IAuthRepository";
import type { User } from "../../../shared/types/User";
import type { LoginResponseDTO } from "../../api/models/apiModels";

const LOGIN_ENDPOINT = "auth/login";
const REGISTER_ENDPOINT = "users";

function getCookie(name: string): string | null {
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split("=");
    if (cookieName === name) return decodeURIComponent(cookieValue);
  }
  return null;
}

export class AuthAdapter implements IAuthRepository {
  async login(
    email: string,
    password: string,
  ): Promise<{ user: User; token: string }> {
    try {
      const response = await axiosInstance.post<LoginResponseDTO>(LOGIN_ENDPOINT, { email, password });
      const loginData = response.data;
      const authUser = loginData.user;

      // El backend establece la cookie jwt automáticamente vía Set-Cookie
      const token = getCookie("jwt") || "";

      let role = "student";
      try {
        const payloadBase64 = token.split(".")[1];
        const payload = JSON.parse(atob(payloadBase64));
        const backendRole = payload.role || "";
        
        if (backendRole === "admin") role = "admin";
        else if (backendRole === "teacher") role = "docente";
        else if (backendRole === "student") role = "student";
        else {
          if (email.includes("admin")) role = "admin";
          else if (email.includes("docente")) role = "docente";
        }
      } catch {
        if (email.includes("admin")) role = "admin";
        else if (email.includes("docente")) role = "docente";
      }

      const user: User = {
        id: authUser.email || "",
        name: authUser.firstName || (role === "admin" ? "Admin" : role === "docente" ? "Profesor" : "Estudiante"),
        email: authUser.email,
        role: role,
      };

      return { user, token };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      throw new Error(
        err.response?.data?.message || 
        "Credenciales incorrectas o error en el servidor"
      );
    }
  }

  async register(
    name: string,
    lastname: string,
    email: string,
    password: string,
    age: number,
    grade: string,
  ): Promise<User> {
    try {
      const response = await axiosInstance.post<string>(REGISTER_ENDPOINT, {
        firstName: name,
        lastName: lastname,
        email,
        passwordHash: password,
        age,
        grade,
        roleIdList: [],
      });

      // Auto-login after registration
      const { user } = await this.login(email, password);
      return user;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      throw new Error(
        err.response?.data?.message || 
        "Error al registrar usuario: " + err.message
      );
    }
  }
}
