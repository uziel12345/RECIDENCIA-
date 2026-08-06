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

const ADMIN_SESSION_HINT_COOKIE = "csrf_token";
let sessionCheckPromise: Promise<boolean> | null = null;

function hasAdminSessionHint(): boolean {
  if (typeof document === "undefined") return true;

  return document.cookie
    .split(";")
    .some(
      (cookie) =>
        cookie.trim().split("=", 1)[0] === ADMIN_SESSION_HINT_COOKIE
    );
}

function clearAdminSessionHint(): void {
  if (typeof document === "undefined") return;

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ADMIN_SESSION_HINT_COOKIE}=; Max-Age=0; Path=/; SameSite=Strict${secure}`;
}

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

  loadSession: () => {
    if (sessionCheckPromise) return sessionCheckPromise;

    if (!hasAdminSessionHint()) {
      set({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      });
      return Promise.resolve(false);
    }

    set({ loading: true, error: null });

    const request = (async () => {
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
        clearAdminSessionHint();
        set({
          user: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        });

        return false;
      }
    })();

    sessionCheckPromise = request;
    void request.finally(() => {
      if (sessionCheckPromise === request) sessionCheckPromise = null;
    });

    return request;
  },

  logout: async () => {
    try {
      await logoutAdminApi();
    } finally {
      clearAdminSessionHint();
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
