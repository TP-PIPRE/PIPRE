import { create } from "zustand";
import type { User } from "../../domain/models/User";

interface AuthState {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  error: null,
  setUser: (user: User) => set({ user, error: null }),
  clearUser: () => set({ user: null }),
  setError: (error: string | null) => set({ error }),
}));
