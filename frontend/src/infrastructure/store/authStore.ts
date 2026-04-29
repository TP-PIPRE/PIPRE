// frontend/src/application/store/authStore.ts
import type { User } from "../../shared/types/User";

// Función para obtener una cookie por nombre
const getCookie = (name: string): string | null => {
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split("=");
    if (cookieName === name) return decodeURIComponent(cookieValue);
  }
  return null;
};

// Función para establecer una cookie
const setCookie = (name: string, value: string, expiresInDays: number = 1) => {
  const date = new Date();
  date.setTime(date.getTime() + expiresInDays * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${date.toUTCString()}; path=/; Secure; SameSite=Strict`;
};

// Función para eliminar una cookie (mejorada para borrar en todos los paths)
const removeCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/docente;`;
  console.log(`Cookie "${name}" eliminada.`);
};

// Obtener el estado de autenticación desde cookies
export const getAuthState = (): {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
} => {
  const token = getCookie("pipre_token");
  const userCookie = getCookie("pipre_user");
  const user = userCookie ? JSON.parse(userCookie) : null;
  return {
    user,
    token,
    isAuthenticated: !!token,
  };
};

// Guardar usuario y token en cookies
export const setAuthState = (user: User, token: string) => {
  setCookie("pipre_user", JSON.stringify(user));
  setCookie("pipre_token", token);
  console.log("Usuario y token guardados en cookies.");
};

// Limpiar todas las cookies de autenticación
export const clearAuthState = () => {
  console.log("Borrando cookies de autenticación...");
  removeCookie("pipre_user");
  removeCookie("pipre_token");
  console.log("Cookies de autenticación eliminadas.");
};
