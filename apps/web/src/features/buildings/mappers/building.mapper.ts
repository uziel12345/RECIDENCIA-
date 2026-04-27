import type { Building } from "../types/building";

type ApiBuilding = {
  id: string;
  name: string;
  code?: string;
  description?: string;
  category_name?: string;
  model_node_name?: string;
  is_active?: boolean;
  x?: number;
  y?: number;
  z?: number;
};

export function mapApiBuildingToBuilding(api: ApiBuilding): Building {
  return {
    id: api.id,
    name: api.name,
    code: api.code ?? "",
    description: api.description ?? "",
    category_name: api.category_name ?? "",
    model_node_name: api.model_node_name ?? "",
    is_active: api.is_active ?? true,
    x: api.x ?? 0,
    y: api.y ?? 0,
    z: api.z ?? 0,
  };
}

export function mapApiBuildings(apiList: ApiBuilding[]): Building[] {
  return apiList.map(mapApiBuildingToBuilding);
}