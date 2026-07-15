import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./client.js";
import type {
  BuildingSchedule,
  CreateBuildingScheduleInput,
  DeleteBuildingScheduleResult,
  UpdateBuildingScheduleInput,
} from "../types/building-schedule.types.js";

export function getBuildingSchedulesApi(buildingId?: string): Promise<BuildingSchedule[]> {
  const query = buildingId ? `?buildingId=${encodeURIComponent(buildingId)}` : "";
  return apiGet<BuildingSchedule[]>(`/building-schedules${query}`);
}

export function createBuildingScheduleApi(
  input: CreateBuildingScheduleInput
): Promise<BuildingSchedule> {
  return apiPost<BuildingSchedule, CreateBuildingScheduleInput>(
    "/building-schedules",
    input
  );
}

export function updateBuildingScheduleApi(
  id: string,
  input: UpdateBuildingScheduleInput
): Promise<BuildingSchedule> {
  return apiPut<BuildingSchedule, UpdateBuildingScheduleInput>(
    `/building-schedules/${id}`,
    input
  );
}

export function updateBuildingScheduleStatusApi(
  id: string,
  is_active: boolean
): Promise<BuildingSchedule> {
  return apiPatch<BuildingSchedule, { is_active: boolean }>(
    `/building-schedules/${id}/status`,
    { is_active }
  );
}

export function deleteBuildingScheduleApi(
  id: string
): Promise<DeleteBuildingScheduleResult> {
  return apiDelete<DeleteBuildingScheduleResult>(`/building-schedules/${id}`);
}
