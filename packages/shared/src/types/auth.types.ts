export type UserRole =
  | "superadmin"
  | "admin"
  | "servicios_escolares"
  | "recursos_humanos"
  | "viewer";

export type AuthUser = {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
};

export type LoginRequest = {
  usernameOrEmail: string;
  password: string;
};

export type LoginResponse = {
  user: AuthUser;
};

export type RolePermissions = {
  can_view_buildings: boolean;
  can_edit_buildings: boolean;
  can_edit_photos: boolean;
  can_manage_admin_users: boolean;
  can_manage_users: boolean;
  can_view_audit_logs: boolean;
  // Fase 4 — módulo académico
  can_view_student_location: boolean;
  can_view_professor_location: boolean;
  can_manage_students: boolean;
  can_manage_professors: boolean;
};

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  superadmin: {
    can_view_buildings: true, can_edit_buildings: true, can_edit_photos: true,
    can_manage_admin_users: true, can_manage_users: true,
    can_view_audit_logs: true,
    can_view_student_location: true, can_view_professor_location: true,
    can_manage_students: true, can_manage_professors: true,
  },
  admin: {
    can_view_buildings: true, can_edit_buildings: true, can_edit_photos: true,
    can_manage_admin_users: false, can_manage_users: false,
    can_view_audit_logs: true,
    can_view_student_location: true, can_view_professor_location: true,
    can_manage_students: true, can_manage_professors: true,
  },
  servicios_escolares: {
    can_view_buildings: true, can_edit_buildings: false, can_edit_photos: false,
    can_manage_admin_users: false, can_manage_users: false,
    can_view_audit_logs: false,
    can_view_student_location: true, can_view_professor_location: false,
    can_manage_students: true, can_manage_professors: false,
  },
  recursos_humanos: {
    can_view_buildings: true, can_edit_buildings: false, can_edit_photos: false,
    can_manage_admin_users: false, can_manage_users: false,
    can_view_audit_logs: false,
    can_view_student_location: false, can_view_professor_location: true,
    can_manage_students: false, can_manage_professors: true,
  },
  viewer: {
    can_view_buildings: false, can_edit_buildings: false, can_edit_photos: false,
    can_manage_admin_users: false, can_manage_users: false,
    can_view_audit_logs: false,
    can_view_student_location: false, can_view_professor_location: false,
    can_manage_students: false, can_manage_professors: false,
  },
};
