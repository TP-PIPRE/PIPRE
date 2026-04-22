import type { IAuthRepository } from "../../../domain/ports/IAuthRepository";
import type { User } from "../../../domain/models/User";

// Credenciales temporales (comentadas para reemplazar con API real)
const MOCK_USER = {
  email: "admin@pipre.com",
  password: "123456",
};

export class AuthAdapter implements IAuthRepository {
  async login(email: string, password: string): Promise<User> {
    // Simulación de autenticación con credenciales estáticas
    if (email === MOCK_USER.email && password === MOCK_USER.password) {
      return {
        id: "1",
        email: MOCK_USER.email,
        role: "admin",
      };
    } else {
      throw new Error("Credenciales incorrectas");
    }

    // Endpoint real (comentado para usar cuando la API esté disponible)
    /*
    const response = await fetch("https://api.pipre.com/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error("Credenciales incorrectas");
    return response.json();
    */
  }
  async register(
    name: string,
    lastname: string,
    email: string,
    password: string,
    age: number,
    grade: string,
  ): Promise<User> {
    const response = await fetch("https://api.pipre.com/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        lastname,
        email,
        password,
        age,
        grade,
        role: "student",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al registrar usuario");
    }

    return response.json();
  }
}
