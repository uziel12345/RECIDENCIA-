import type { UserRole } from "../store/auth-store";

export interface RouteConfig {
  path: string;
  allowedRoles?: UserRole[];
  requiresAuth?: boolean;
}

export const ROUTES = {
  WELCOME: "/",
  ONBOARDING: "/onboarding",
  LOGIN: "/login",
  
  // Public map views
  STUDENT: "/student",
  VISITOR: "/visitor",
  
  // Admin views
  STAFF: "/staff",
  ADMIN: "/admin",
  
  // Map is the main campus view
  MAP: "/map",
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
