import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./client.js";
import type {
  CreateDepartmentInput,
  DeleteDepartmentResult,
  Department,
  UpdateDepartmentInput,
} from "../types/department.types.js";

export function getDepartmentsApi(buildingId?: string): Promise<Department[]> {
  const query = buildingId ? `?buildingId=${encodeURIComponent(buildingId)}` : "";
  return apiGet<Department[]>(`/departments${query}`);
}

export function createDepartmentApi(
  input: CreateDepartmentInput
): Promise<Department> {
  return apiPost<Department, CreateDepartmentInput>("/departments", input);
}

export function updateDepartmentApi(
  id: string,
  input: UpdateDepartmentInput
): Promise<Department> {
  return apiPut<Department, UpdateDepartmentInput>(`/departments/${id}`, input);
}

export function updateDepartmentStatusApi(
  id: string,
  is_active: boolean
): Promise<Department> {
  return apiPatch<Department, { is_active: boolean }>(
    `/departments/${id}/status`,
    { is_active }
  );
}

export function deleteDepartmentApi(id: string): Promise<DeleteDepartmentResult> {
  return apiDelete<DeleteDepartmentResult>(`/departments/${id}`);
}
