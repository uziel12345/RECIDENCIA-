import {
  getAdminBuildingsApi,
  getBuildingByIdApi,
  getBuildingsApi,
  type Building,
} from "@ito-map/shared";

export async function getBuildings(): Promise<Building[]> {
  return getBuildingsApi();
}

export async function getAdminBuildings(): Promise<Building[]> {
  try {
    return await getAdminBuildingsApi();
  } catch {
    // Auth expirada u otro error de admin → devolver la lista pública
    return getBuildingsApi();
  }
}

export async function getBuildingById(id: string): Promise<Building | null> {
  return getBuildingByIdApi(id);
}
