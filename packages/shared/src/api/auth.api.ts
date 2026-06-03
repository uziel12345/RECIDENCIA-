import { apiGet, apiPatch, apiPost } from "./client.js";
import type { AuthUser, LoginRequest, LoginResponse } from "../types/auth.types.js";

export type CreateAdminUserRequest = {
  username: string;
  full_name: string;
  email: string;
  password: string;
  role: AuthUser["role"];
  is_active: boolean;
};

type MeApiResponse = {
  user: AuthUser;
};

type AdminUsersResponse = {
  users: AuthUser[];
};

type AdminUserResponse = {
  user: AuthUser;
};

export async function loginAdminApi(input: LoginRequest): Promise<LoginResponse> {
  return apiPost<LoginResponse, LoginRequest>("/auth/login", input);
}

export async function logoutAdminApi(): Promise<void> {
  await apiPost("/auth/logout", {});
}

export async function getMeApi(): Promise<AuthUser> {
  const response = await apiGet<MeApiResponse>("/auth/me");
  return response.user;
}

export async function getAdminUsersApi(): Promise<AuthUser[]> {
  const response = await apiGet<AdminUsersResponse>("/auth/admin-users");
  return response.users;
}

export async function createAdminUserApi(
  input: CreateAdminUserRequest
): Promise<AuthUser> {
  const response = await apiPost<AdminUserResponse, CreateAdminUserRequest>(
    "/auth/admin-users",
    input
  );
  return response.user;
}

export async function updateAdminUserStatusApi(
  userId: string,
  is_active: boolean
): Promise<AuthUser> {
  const response = await apiPatch<AdminUserResponse, { is_active: boolean }>(
    `/auth/admin-users/${userId}/status`,
    { is_active }
  );
  return response.user;
}
