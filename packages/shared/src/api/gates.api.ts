import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./client.js";
import type {
  CreateGateInput,
  DeleteGateResult,
  Gate,
  UpdateGateInput,
} from "../types/gate.types.js";

export function getGatesApi(): Promise<Gate[]> {
  return apiGet<Gate[]>("/gates");
}

export function getGatesForAdminApi(): Promise<Gate[]> {
  return apiGet<Gate[]>("/gates/admin/all");
}

export function getGateByIdApi(id: string): Promise<Gate> {
  return apiGet<Gate>(`/gates/${id}`);
}

export function createGateApi(input: CreateGateInput): Promise<Gate> {
  return apiPost<Gate, CreateGateInput>("/gates", input);
}

export function updateGateApi(id: string, input: UpdateGateInput): Promise<Gate> {
  return apiPut<Gate, UpdateGateInput>(`/gates/${id}`, input);
}

export function updateGateStatusApi(id: string, is_active: boolean): Promise<Gate> {
  return apiPatch<Gate, { is_active: boolean }>(`/gates/${id}/status`, { is_active });
}

export function deleteGateApi(id: string): Promise<DeleteGateResult> {
  return apiDelete<DeleteGateResult>(`/gates/${id}`);
}
