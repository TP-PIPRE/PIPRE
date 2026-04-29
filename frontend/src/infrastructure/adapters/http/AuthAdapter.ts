import axiosInstance from "../../api/axiosInstance";
import type { IAuthRepository } from "../../ports/IAuthRepository";
import type { User } from "../../../shared/types/User";

const LOGIN_ENDPOINT = "auth/login";
const REGISTER_ENDPOINT = "users";

export class AuthAdapter implements IAuthRepository {
  async login(
    email: string,
    password: string,
  ): Promise<{ user: User; token: string }> {
    try {
      const response = await axiosInstance.post(LOGIN_ENDPOINT, { email, password });

      // El backend devuelve el token como un string simple
      const token = response.data;

      // Construimos el usuario basado en las credenciales enviadas exitosamente
      const user: User = {
        id: email === "admin@pipre.com" ? "1" : "2",
        name: email === "admin@pipre.com" ? "Admin" : "Usuario",
        email: email,
        role: email === "admin@pipre.com" ? "admin" : "student",
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
      const response = await axiosInstance.post(REGISTER_ENDPOINT, {
        first_name: name,
        last_name: lastname,
        email,
        password,
        age,
        grade,
        role: "student" as const,
      });

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 
        "Error al registrar usuario: " + error.message
      );
    }
  }
}
