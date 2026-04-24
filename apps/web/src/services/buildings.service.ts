import { fetchAPI } from "./api";
import type { Building } from "../features/buildings/types/building";

export async function getBuildings(): Promise<Building[]> {
  return fetchAPI<Building[]>("/buildings");
}

export async function getBuildingImages(buildingId: string) {
  return fetchAPI(`/buildings/${buildingId}/images`);
}