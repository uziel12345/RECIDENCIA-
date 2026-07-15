import { apiGet } from "./client.js";
import type { BuildingFullDetails } from "../types/building-details.types.js";

export function getBuildingFullDetailsApi(buildingId: string): Promise<BuildingFullDetails> {
  return apiGet<BuildingFullDetails>(`/buildings/${buildingId}/full-details`);
}
