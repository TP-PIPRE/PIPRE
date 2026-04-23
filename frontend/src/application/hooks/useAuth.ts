import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../infrastructure/store/authStore";
import { LoginUserUseCase } from "../usecases/LoginUserUseCase";
import { AuthAdapter } from "../../infrastructure/adapters/http/AuthAdapter";

export const useAuth = () => {
  const { setUser, setError } = useAuthStore();
  const navigate = useNavigate();
  const loginUserUseCase = new LoginUserUseCase(new AuthAdapter());

  const login = async (email: string, password: string) => {
    try {
      const { user, token } = await loginUserUseCase.execute(email, password);
      setUser(user, token);
      setError(null);

      // Redirigir según el rol del usuario
      if (user.role === "docente") {
        navigate("/docente/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(
        "Credenciales incorrectas: " +
          (err instanceof Error ? err.message : String(err)),
      );
    }
  };

  return {
    user: useAuthStore((state) => state.user),
    error: useAuthStore((state) => state.error),
    login,
  };
};
