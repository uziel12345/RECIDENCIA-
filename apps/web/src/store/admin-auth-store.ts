import { create } from "zustand";
import {
  getMeApi,
  loginAdminApi,
  type AuthUser,
} from "@ito-map/shared";

type AdminAuthState = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  login: (username: string, password: string) => Promise<boolean>;
  loadSession: () => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
};

const TOKEN_KEY = "admin_token";

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  user: null,
  token: localStorage.getItem(TOKEN_KEY),
  loading: false,
  error: null,
  isAuthenticated: Boolean(localStorage.getItem(TOKEN_KEY)),

  login: async (username, password) => {
    set({ loading: true, error: null });

    try {
      const response = await loginAdminApi({
        usernameOrEmail: username,
        password,
      });

      localStorage.setItem(TOKEN_KEY, response.token);

      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        loading: false,
        error: null,
      });

      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo iniciar sesión";

      localStorage.removeItem(TOKEN_KEY);

      set({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: message,
      });

      return false;
    }
  },

  loadSession: async () => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      });

      return false;
    }

    set({ loading: true, error: null });

    try {
      const user = await getMeApi();

      set({
        user,
        token,
        isAuthenticated: true,
        loading: false,
        error: null,
      });

      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Sesión administrativa inválida";

      localStorage.removeItem(TOKEN_KEY);

      set({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: message,
      });

      return false;
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));
