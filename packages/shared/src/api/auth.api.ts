import { apiGet, apiPost } from "./client.js";
import type { AuthUser, LoginRequest, LoginResponse } from "../types/auth.types.js";

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
