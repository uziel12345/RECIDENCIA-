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

  login: (usernameOrEmail: string, password: string) => Promise<boolean>;
  loadSession: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
};

const ADMIN_TOKEN_KEY = "admin_token";

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  user: null,
  token: localStorage.getItem(ADMIN_TOKEN_KEY),
  loading: false,
  error: null,
  isAuthenticated: Boolean(localStorage.getItem(ADMIN_TOKEN_KEY)),

  async login(usernameOrEmail: string, password: string) {
    set({
      loading: true,
      error: null,
    });

    try {
      const result = await loginAdminApi({
        usernameOrEmail,
        password,
      });

      localStorage.setItem(ADMIN_TOKEN_KEY, result.token);

      set({
        user: result.user,
        token: result.token,
        isAuthenticated: true,
        loading: false,
        error: null,
      });

      return true;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo iniciar sesión";

      localStorage.removeItem(ADMIN_TOKEN_KEY);

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

  async loadSession() {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);

    if (!token) {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      });
      return;
    }

    set({
      loading: true,
      error: null,
    });

    try {
      const result = await getMeApi();

      set({
        user: result.user,
        token,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "La sesión expiró o no es válida";

      localStorage.removeItem(ADMIN_TOKEN_KEY);

      set({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: message,
      });
    }
  },

  logout() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  },

  clearError() {
    set({
      error: null,
    });
  },
}));