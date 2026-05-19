import { apiGet, apiPatch, apiPost } from "./client.ts";
import type {
  AdminUser,
  AuthUser,
  CreateAdminUserRequest,
  LoginRequest,
  LoginResponse,
  UpdateAdminUserRequest,
  UpdateAdminUserStatusRequest,
} from "../types/auth.types.ts";

type MeApiResponse = {
  user: AuthUser;
};

type AdminCheckResponse = {
  message: string;
};

export function loginAdminApi(input: LoginRequest): Promise<LoginResponse> {
  return apiPost<LoginResponse, LoginRequest>("/auth/login", input);
}

export async function getMeApi(): Promise<AuthUser> {
  const response = await apiGet<MeApiResponse>("/auth/me");
  return response.user;
}

export function adminCheckApi(): Promise<AdminCheckResponse> {
  return apiGet<AdminCheckResponse>("/auth/admin-check");
}

export function getAdminUsersApi(): Promise<AdminUser[]> {
  return apiGet<AdminUser[]>("/admin-users");
}

export function createAdminUserApi(
  input: CreateAdminUserRequest
): Promise<AdminUser> {
  return apiPost<AdminUser, CreateAdminUserRequest>("/admin-users", input);
}

export function updateAdminUserApi(
  id: string,
  input: UpdateAdminUserRequest
): Promise<AdminUser> {
  return apiPatch<AdminUser, UpdateAdminUserRequest>(`/admin-users/${id}`, input);
}

export function updateAdminUserStatusApi(
  id: string,
  input: UpdateAdminUserStatusRequest
): Promise<AdminUser> {
  return apiPatch<AdminUser, UpdateAdminUserStatusRequest>(
    `/admin-users/${id}/status`,
    input
  );
}
