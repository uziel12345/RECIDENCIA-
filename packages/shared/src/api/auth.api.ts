import { apiGet, apiPost } from "./client.ts";
import type { AuthUser } from "../types/auth.types.ts";

export type LoginAdminInput = {
  usernameOrEmail: string;
  password: string;
};

export type LoginAdminResult = {
  token: string;
  user: AuthUser;
};

export type MeResult = {
  user: AuthUser;
};

export type AdminCheckResult = {
  message: string;
};

export function loginAdminApi(
  input: LoginAdminInput
): Promise<LoginAdminResult> {
  return apiPost<LoginAdminResult, LoginAdminInput>("/auth/login", input);
}

export function getMeApi(): Promise<MeResult> {
  return apiGet<MeResult>("/auth/me");
}

export function adminCheckApi(): Promise<AdminCheckResult> {
  return apiGet<AdminCheckResult>("/auth/admin-check");
}