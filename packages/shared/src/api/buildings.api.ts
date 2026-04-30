import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
} from "./client.ts";
import type {
  Building,
  BuildingImage,
  CreateBuildingInput,
  DeleteBuildingResult,
  UpdateBuildingInput,
  UpdateBuildingStatusInput,
} from "../types/building.types.ts";

export function getBuildingsApi(): Promise<Building[]> {
  return apiGet<Building[]>("/buildings");
}

export function getBuildingByIdApi(id: string): Promise<Building> {
  return apiGet<Building>(`/buildings/${id}`);
}

export function getBuildingImagesApi(
  buildingId: string
): Promise<BuildingImage[]> {
  return apiGet<BuildingImage[]>(`/buildings/${buildingId}/images`);
}

export function createBuildingApi(
  input: CreateBuildingInput
): Promise<Building> {
  return apiPost<Building, CreateBuildingInput>("/buildings", input);
}

export function updateBuildingApi(
  id: string,
  input: UpdateBuildingInput
): Promise<Building> {
  return apiPut<Building, UpdateBuildingInput>(`/buildings/${id}`, input);
}

export function updateBuildingStatusApi(
  id: string,
  input: UpdateBuildingStatusInput
): Promise<Building> {
  return apiPatch<Building, UpdateBuildingStatusInput>(
    `/buildings/${id}/status`,
    input
  );
}

export function deleteBuildingApi(id: string): Promise<DeleteBuildingResult> {
  return apiDelete<DeleteBuildingResult>(`/buildings/${id}`);
}