import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PublicRole = "student" | "visitor";

export interface User {
  id: string;
  name: string;
  email: string;
  role: PublicRole;
  studentId?: string;
  department?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  logout: () => void;
  selectRole: (role: PublicRole, userData?: Partial<User>) => void;
  completeOnboarding: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      hasCompletedOnboarding: false,

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
        }),

      selectRole: (role: PublicRole, userData?: Partial<User>) => {
        const user: User = {
          id: crypto.randomUUID(),
          name: userData?.name || (role === "student" ? "Estudiante" : "Visitante"),
          email: userData?.email || "",
          role,
          studentId: userData?.studentId,
        };

        set({
          user,
          isAuthenticated: true,
        });
      },

      completeOnboarding: () =>
        set({
          hasCompletedOnboarding: true,
        }),
    }),
    {
      name: "ito-auth-storage",
      version: 1,
      migrate: (persisted, version) => {
        if (version === 0) {
          const old = persisted as { user?: { role?: string }; hasCompletedOnboarding?: boolean };
          const role = old.user?.role;
          if (role !== "student" && role !== "visitor") {
            return { user: null, isAuthenticated: false, hasCompletedOnboarding: false };
          }
        }
        return persisted as Pick<AuthState, "user" | "isAuthenticated" | "hasCompletedOnboarding">;
      },
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    }
  )
);

