export const ROUTES = {
  WELCOME: "/",
  ONBOARDING: "/onboarding",
  
  // Public map views
  STUDENT: "/student",
  VISITOR: "/visitor",
  
  // Real admin views
  ADMIN_LOGIN: "/admin/login",
  ADMIN_BUILDINGS: "/admin/buildings",
  ADMIN_BUILDING_NEW: "/admin/buildings/new",
  ADMIN_BUILDING_EDIT: "/admin/buildings/:id/edit",
  ADMIN_CATEGORIES: "/admin/categories",
  ADMIN_SERVICES: "/admin/services",
  ADMIN_GATES: "/admin/gates",
  ADMIN_USERS: "/admin/users",
  ADMIN_STUDENT_LOCATION: "/admin/alumnos/ubicacion",
  ADMIN_PROFESSOR_LOCATION: "/admin/profesores/ubicacion",
  
  // Map is the main campus view
  MAP: "/map",
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
