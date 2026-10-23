/** Session metadata for navigation only. The HttpOnly JWT is managed by the server. */
import type { User } from "../../shared/types/User";
const readUser = (): User | null => {
  try {
    const prefix = "pipre_user=";
    const value = document.cookie.split(";").map(c => c.trim()).find(c => c.startsWith(prefix));
    if (!value) return null;
    const user = JSON.parse(decodeURIComponent(value.slice(prefix.length)));
    return user && typeof user.id === "string" && user.id && typeof user.email === "string" && typeof user.name === "string" && ["student", "docente", "admin"].includes(user.role) ? user : null;
  } catch { return null; }
};
export const getAuthState = () => {
  const user = readUser();
  return { user, isAuthenticated: !!user };
};
export const setAuthState = (user: User) => {
  document.cookie = `pipre_user=${encodeURIComponent(JSON.stringify(user))}; Max-Age=3600; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
};
export const clearAuthState = () => {
  for (const name of ["pipre_user", "pipre_token"]) {
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
  }
};
