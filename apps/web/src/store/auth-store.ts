import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PublicRole = "student" | "visitor";

export interface User {
  id: string;
  name: string;
  email: string;
  role: PublicRole;
  studentId?: string;
  controlNumber?: string;
  department?: string;
}

// ITO control numbers: 8-9 numeric digits (e.g. 20060123 or 200601234)
const CONTROL_NUMBER_RE = /^\d{8,9}$/;

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  sessionStartedAt: number | null;

  // Actions
  setUser: (user: User | null) => void;
  logout: () => void;
  selectRole: (role: PublicRole, userData?: Partial<User>) => void;
  completeOnboarding: () => void;
  setControlNumber: (controlNumber: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      sessionStartedAt: null,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          hasCompletedOnboarding: false,
          sessionStartedAt: null,
        }),

      selectRole: (role: PublicRole, userData?: Partial<User>) => {
        const user: User = {
          id:
            globalThis.crypto?.randomUUID?.() ??
            `session-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`,
          name: userData?.name || (role === "student" ? "Estudiante" : "Visitante"),
          email: userData?.email || "",
          role,
          studentId: userData?.studentId,
        };

        set({
          user,
          isAuthenticated: true,
          sessionStartedAt: Date.now(),
        });
      },

      completeOnboarding: () =>
        set({
          hasCompletedOnboarding: true,
        }),

      setControlNumber: (controlNumber: string) => {
        if (controlNumber !== "" && !CONTROL_NUMBER_RE.test(controlNumber)) return;
        set((state) => ({
          user: state.user
            ? { ...state.user, controlNumber: controlNumber || undefined }
            : state.user,
        }));
      },
    }),
    {
      name: "ito-auth-storage",
      version: 1,
      migrate: (persisted, version) => {
        if (version === 0) {
          const old = persisted as { user?: { role?: string }; hasCompletedOnboarding?: boolean };
          const role = old.user?.role;
          if (role !== "student" && role !== "visitor") {
            return { user: null, isAuthenticated: false, hasCompletedOnboarding: false, sessionStartedAt: null };
          }
        }
        return persisted as Pick<AuthState, "user" | "isAuthenticated" | "hasCompletedOnboarding" | "sessionStartedAt">;
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (
          state.isAuthenticated &&
          state.sessionStartedAt !== null &&
          Date.now() - state.sessionStartedAt > SESSION_TTL_MS
        ) {
          state.logout();
        }
      },
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        sessionStartedAt: state.sessionStartedAt,
      }),
    }
  )
);
