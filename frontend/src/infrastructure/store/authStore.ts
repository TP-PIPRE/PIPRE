import { create } from "zustand";
import type { User } from "../../domain/models/User";

interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User, token?: string) => void;
  clearUser: () => void;
  logout: () => void;
  error: string | null;
  setError: (error: string | null) => void;
}

// Restore session from localStorage on load
const storedUser = (() => {
  try {
    const raw = localStorage.getItem("pipre_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();
const storedToken = localStorage.getItem("pipre_token");

export const useAuthStore = create<AuthState>((set) => ({
  user: storedUser,
  token: storedToken,
  error: null,
  setUser: (user: User, token?: string) => {
    localStorage.setItem("pipre_user", JSON.stringify(user));
    if (token) localStorage.setItem("pipre_token", token);
    set({ user, token: token ?? null, error: null });
  },
  clearUser: () => {
    localStorage.removeItem("pipre_user");
    localStorage.removeItem("pipre_token");
    set({ user: null, token: null });
  },
  logout: () => {
    localStorage.removeItem("pipre_user");
    localStorage.removeItem("pipre_token");
    set({ user: null, token: null });
  },
  setError: (error: string | null) => set({ error }),
}));
