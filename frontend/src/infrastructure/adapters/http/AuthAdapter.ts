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

      // Intentamos obtener el rol del token (JWT)
      let role = "student";
      try {
        const payloadBase64 = token.split(".")[1];
        const payload = JSON.parse(atob(payloadBase64));
        const backendRole = payload.role || "";
        
        if (backendRole === "admin") role = "admin";
        else if (backendRole === "teacher") role = "docente";
        else if (backendRole === "student") role = "student";
        else {
          // Fallback por email si el rol no viene claro en el token
          if (email.includes("admin")) role = "admin";
          else if (email.includes("docente")) role = "docente";
        }
      } catch (e) {
        // Fallback total si el token no es JWT
        if (email.includes("admin")) role = "admin";
        else if (email.includes("docente")) role = "docente";
      }

      const user: User = {
        id: role === "admin" ? "1" : (role === "docente" ? "2" : "3"),
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
