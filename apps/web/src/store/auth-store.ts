import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "student" | "visitor" | "staff" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  studentId?: string;
  department?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  selectRole: (role: UserRole, userData?: Partial<User>) => void;
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

      login: async (email: string, password: string, role: UserRole) => {
        // Simulated login - in production this would call the API
        // For staff/admin roles, we require authentication
        if (role === "staff" || role === "admin") {
          // Mock authentication check
          if (password.length < 4) {
            return false;
          }
          
          const user: User = {
            id: crypto.randomUUID(),
            name: email.split("@")[0],
            email,
            role,
            department: role === "admin" ? "Administracion" : "Personal",
          };
          
          set({
            user,
            isAuthenticated: true,
          });
          
          return true;
        }
        
        return false;
      },

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),

      selectRole: (role: UserRole, userData?: Partial<User>) => {
        // For public roles (student/visitor), create a session without full auth
        const user: User = {
          id: crypto.randomUUID(),
          name: userData?.name || (role === "student" ? "Estudiante" : "Visitante"),
          email: userData?.email || "",
          role,
          studentId: userData?.studentId,
        };

        set({
          user,
          isAuthenticated: role === "student" || role === "visitor",
        });
      },

      completeOnboarding: () =>
        set({
          hasCompletedOnboarding: true,
        }),
    }),
    {
      name: "ito-auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    }
  )
);

// Helper hooks
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useUserRole = () => useAuthStore((state) => state.user?.role);
