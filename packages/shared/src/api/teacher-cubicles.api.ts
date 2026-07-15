import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./client.js";
import type {
  CreateTeacherCubicleInput,
  DeleteTeacherCubicleResult,
  TeacherCubicle,
  UpdateTeacherCubicleInput,
} from "../types/teacher-cubicle.types.js";

export function getTeacherCubiclesApi(buildingId?: string): Promise<TeacherCubicle[]> {
  const query = buildingId ? `?buildingId=${encodeURIComponent(buildingId)}` : "";
  return apiGet<TeacherCubicle[]>(`/teacher-cubicles${query}`);
}

export function createTeacherCubicleApi(
  input: CreateTeacherCubicleInput
): Promise<TeacherCubicle> {
  return apiPost<TeacherCubicle, CreateTeacherCubicleInput>("/teacher-cubicles", input);
}

export function updateTeacherCubicleApi(
  id: string,
  input: UpdateTeacherCubicleInput
): Promise<TeacherCubicle> {
  return apiPut<TeacherCubicle, UpdateTeacherCubicleInput>(
    `/teacher-cubicles/${id}`,
    input
  );
}

export function updateTeacherCubicleStatusApi(
  id: string,
  is_active: boolean
): Promise<TeacherCubicle> {
  return apiPatch<TeacherCubicle, { is_active: boolean }>(
    `/teacher-cubicles/${id}/status`,
    { is_active }
  );
}

export function deleteTeacherCubicleApi(
  id: string
): Promise<DeleteTeacherCubicleResult> {
  return apiDelete<DeleteTeacherCubicleResult>(`/teacher-cubicles/${id}`);
}
