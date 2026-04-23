import type { IAuthRepository } from "../../../domain/ports/IAuthRepository";
import type { User } from "../../../domain/models/User";

// Credenciales temporales
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

export class AuthAdapter implements IAuthRepository {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    // Simulación de autenticación con credenciales estáticas
    const user = MOCK_USERS.find(
      (u) => u.email === email && u.password === password,
    );
    if (user) {
      // Mock JWT token (base64 header.payload.signature)
      const mockToken = btoa(JSON.stringify({ email: user.email, role: user.role, exp: Date.now() + 3600000 }));
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
    // Endpoint real
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
        role: "student" as const,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al registrar usuario");
    }

    return response.json();
  }
}
