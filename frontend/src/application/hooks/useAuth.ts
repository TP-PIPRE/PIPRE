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

      // Guarda en cookies
      setAuthState(user, token);

      // Redirigir según el rol del usuario
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

  const logout = () => {
    clearAuthState(); // Elimina cookies
    navigate("/login");
  };

  // Obtener el estado actual de autenticación
  const { user, token, isAuthenticated } = getAuthState();

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
  };
};
