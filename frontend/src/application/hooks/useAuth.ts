import { useNavigate } from "react-router-dom";
import { AuthAdapter } from "../../infrastructure/adapters/http/AuthAdapter";
import {
  getAuthState,
  setAuthState,
  clearAuthState,
} from "../../infrastructure/store/authStore";

export const useAuth = () => {
  const navigate = useNavigate();
  const authAdapter = new AuthAdapter();

  const login = async (email: string, password: string) => {
    try {
      const { user, token } = await authAdapter.login(email, password);

      setAuthState(user, token);

      if (user.role === "docente") {
        navigate("/docente/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      throw new Error(
        "Credenciales incorrectas: " +
          (err instanceof Error ? err.message : String(err)),
      );
    }
  };

  const register = async (
    name: string,
    lastname: string,
    email: string,
    password: string,
    age: number,
    grade: string,
  ) => {
    try {
      const user = await authAdapter.register(name, lastname, email, password, age, grade);
      return user;
    } catch (err) {
      throw new Error(
        "Error al registrar: " +
          (err instanceof Error ? err.message : String(err)),
      );
    }
  };

  const logout = () => {
    clearAuthState();
    navigate("/login");
  };

  const { user, token, isAuthenticated } = getAuthState();

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout,
  };
};
