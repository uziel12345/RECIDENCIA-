import { apiGet } from "./client.js";
import type {
  CampusStreet,
  InstitutionalPosition,
  QuickQuery,
} from "../types/campus-catalog.types.js";

export function getCampusStreetsApi(): Promise<CampusStreet[]> {
  return apiGet<CampusStreet[]>("/streets", { cache: "default" });
}

export function getQuickQueriesApi(): Promise<QuickQuery[]> {
  return apiGet<QuickQuery[]>("/quick-queries", { cache: "default" });
}

export function getInstitutionalPositionsApi(): Promise<InstitutionalPosition[]> {
  return apiGet<InstitutionalPosition[]>("/positions", { cache: "default" });
}

export function getInstitutionalPositionApi(
  id: string
): Promise<InstitutionalPosition> {
  return apiGet<InstitutionalPosition>(`/positions/${encodeURIComponent(id)}`);
}

export function getBuildingPositionsApi(
  buildingId: string
): Promise<InstitutionalPosition[]> {
  return apiGet<InstitutionalPosition[]>(
    `/buildings/${encodeURIComponent(buildingId)}/positions`,
    { cache: "default" }
  );
}
