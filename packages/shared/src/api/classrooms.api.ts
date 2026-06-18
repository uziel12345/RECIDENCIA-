import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./client.js";
import type {
  Classroom,
  CreateClassroomInput,
  DeleteClassroomResult,
  UpdateClassroomInput,
} from "../types/classroom.types.js";

export function getClassroomsApi(buildingId?: string): Promise<Classroom[]> {
  const query = buildingId ? `?buildingId=${encodeURIComponent(buildingId)}` : "";
  return apiGet<Classroom[]>(`/classrooms${query}`);
}

export function createClassroomApi(
  input: CreateClassroomInput
): Promise<Classroom> {
  return apiPost<Classroom, CreateClassroomInput>("/classrooms", input);
}

export function updateClassroomApi(
  id: string,
  input: UpdateClassroomInput
): Promise<Classroom> {
  return apiPut<Classroom, UpdateClassroomInput>(`/classrooms/${id}`, input);
}

export function updateClassroomStatusApi(
  id: string,
  is_active: boolean
): Promise<Classroom> {
  return apiPatch<Classroom, { is_active: boolean }>(
    `/classrooms/${id}/status`,
    { is_active }
  );
}

export function deleteClassroomApi(id: string): Promise<DeleteClassroomResult> {
  return apiDelete<DeleteClassroomResult>(`/classrooms/${id}`);
}
