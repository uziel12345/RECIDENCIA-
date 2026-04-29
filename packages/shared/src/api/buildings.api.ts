import { apiGet } from "./client.ts";
import type { Building, BuildingImage } from "../types/building.types.ts";

export function getBuildingsApi(): Promise<Building[]> {
  return apiGet<Building[]>("/buildings");
}

export function getBuildingByIdApi(id: string): Promise<Building> {
  return apiGet<Building>(`/buildings/${id}`);
}

export function getBuildingImagesApi(buildingId: string): Promise<BuildingImage[]> {
  return apiGet<BuildingImage[]>(`/buildings/${buildingId}/images`);
}