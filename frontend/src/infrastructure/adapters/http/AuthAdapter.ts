import axiosInstance from "../../api/axiosInstance";
import type { IAuthRepository } from "../../ports/IAuthRepository";
import type { User } from "../../../shared/types/User";

const LOGIN_ENDPOINT = "auth/login";
const REGISTER_ENDPOINT = "users";

const STORAGE_KEY = "pipre_registered_users";

function getStoredUserIds(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function storeUserId(email: string, uuid: string): void {
  const users = getStoredUserIds();
  users[email] = uuid;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export class AuthAdapter implements IAuthRepository {
  async login(
    email: string,
    password: string,
  ): Promise<{ user: User; token: string }> {
    try {
      const response = await axiosInstance.post(LOGIN_ENDPOINT, { email, password });
      const token = response.data;

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
      } catch (e) {
        if (email.includes("admin")) role = "admin";
        else if (email.includes("docente")) role = "docente";
      }

      // Look up real UUID stored during registration
      const storedUsers = getStoredUserIds();
      const uuid = storedUsers[email] || "";

      const user: User = {
        id: uuid,
        name: role === "admin" ? "Admin" : (role === "docente" ? "Profesor" : "Estudiante"),
        email: email,
        role: role,
      };

      return { user, token };
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 
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
        role: "student",
      });

      const uuid = response.data;
      storeUserId(email, uuid);

      // Auto-login after registration
      const { user } = await this.login(email, password);
      return user;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 
        "Error al registrar usuario: " + error.message
      );
    }
  }
}
