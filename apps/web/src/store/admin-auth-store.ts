import { create } from "zustand";
import {
  getMeApi,
  loginAdminApi,
  logoutAdminApi,
  type AuthUser,
} from "@ito-map/shared";

type AdminAuthState = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  login: (username: string, password: string) => Promise<boolean>;
  loadSession: () => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
};

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,

  login: async (username, password) => {
    set({ loading: true, error: null });

    try {
      const response = await loginAdminApi({
        usernameOrEmail: username,
        password,
      });

      set({
        user: response.user,
        isAuthenticated: true,
        loading: false,
        error: null,
      });

      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo iniciar sesión";

      set({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: message,
      });

      return false;
    }
  },

  loadSession: async () => {
    set({ loading: true, error: null });

    try {
      const user = await getMeApi();

      set({
        user,
        isAuthenticated: true,
        loading: false,
        error: null,
      });

      return true;
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      });

      return false;
    }
  },

  logout: async () => {
    try {
      await logoutAdminApi();
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
