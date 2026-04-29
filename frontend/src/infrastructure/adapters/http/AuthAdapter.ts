import type { IAuthRepository } from "../../ports/IAuthRepository";
import type { User } from "../../../shared/types/User";

// Credenciales temporales (mock)
const MOCK_USERS = [
  {
    email: "admin@pipre.com",
    password: "123456",
    role: "admin" as const,
  },
  {
    email: "docente@pipre.com",
    password: "123456",
    role: "docente" as const,
  },
];

const LOGIN_ENDPOINT = "/api/v1/auth/login";
const REGISTER_ENDPOINT = "/api/v1/users";

export class AuthAdapter implements IAuthRepository {
  async login(
    email: string,
    password: string,
  ): Promise<{ user: User; token: string }> {
    try {
      const response = await fetch(LOGIN_ENDPOINT, {
        method: "POST",
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            "Credenciales incorrectas o error en el servidor",
        );
      }

      const token = await response.text();

      const user: User = {
        id: email === "admin@pipre.com" ? "1" : "2",
        name: email === "admin@pipre.com" ? "Admin" : "Prof. García",
        email: email,
        role: email === "admin@pipre.com" ? "admin" : "docente",
      };

      return { user, token };
    } catch (error) {
      console.warn("Fallback a mock:", error);
      const user = MOCK_USERS.find(
        (u) => u.email === email && u.password === password,
      );

      if (user) {
        const mockToken = btoa(
          JSON.stringify({
            email: user.email,
            role: user.role,
            exp: Date.now() + 3600000,
          }),
        );

        return {
          user: {
            id: user.role === "admin" ? "1" : "2",
            name: user.role === "docente" ? "Prof. García" : "Admin",
            email: user.email,
            role: user.role,
          },
          token: mockToken,
        };
      } else {
        throw new Error("Credenciales incorrectas");
      }
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
      const response = await fetch(REGISTER_ENDPOINT, {
        method: "POST",
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: name,
          last_name: lastname,
          email,
          password,
          age,
          grade,
          role: "student" as const,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al registrar usuario");
      }

      return response.json();
    } catch (error) {
      throw new Error("No se pudo registrar el usuario: " + error);
    }
  }
}
