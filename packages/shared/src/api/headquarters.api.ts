import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./client.js";
import type {
  CreateHeadquartersInput,
  DeleteHeadquartersResult,
  Headquarters,
  UpdateHeadquartersInput,
} from "../types/headquarters.types.js";

export function getHeadquartersApi(buildingId?: string): Promise<Headquarters[]> {
  const query = buildingId ? `?buildingId=${encodeURIComponent(buildingId)}` : "";
  return apiGet<Headquarters[]>(`/headquarters${query}`);
}

export function createHeadquartersApi(
  input: CreateHeadquartersInput
): Promise<Headquarters> {
  return apiPost<Headquarters, CreateHeadquartersInput>("/headquarters", input);
}

export function updateHeadquartersApi(
  id: string,
  input: UpdateHeadquartersInput
): Promise<Headquarters> {
  return apiPut<Headquarters, UpdateHeadquartersInput>(`/headquarters/${id}`, input);
}

export function updateHeadquartersStatusApi(
  id: string,
  is_active: boolean
): Promise<Headquarters> {
  return apiPatch<Headquarters, { is_active: boolean }>(
    `/headquarters/${id}/status`,
    { is_active }
  );
}

export function deleteHeadquartersApi(id: string): Promise<DeleteHeadquartersResult> {
  return apiDelete<DeleteHeadquartersResult>(`/headquarters/${id}`);
}
