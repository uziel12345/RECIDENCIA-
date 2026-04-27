import type { Building } from "../types/building";

type ApiBuilding = {
  id: string;
  code?: string;
  name: string;
  slug?: string;
  description?: string | null;
  model_node_name?: string;
  x?: number | null;
  y?: number | null;
  z?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  is_active?: boolean;
  is_priority?: boolean;
  category_code?: string;
  category_name?: string;
  category_color?: string | null;
};

export function mapApiBuildingToBuilding(api: ApiBuilding): Building {
  return {
    id: api.id,
    code: api.code ?? "",
    name: api.name,
    slug: api.slug ?? "",
    description: api.description ?? null,
    model_node_name: api.model_node_name ?? "",
    x: api.x ?? null,
    y: api.y ?? null,
    z: api.z ?? null,
    latitude: api.latitude ?? null,
    longitude: api.longitude ?? null,
    is_active: api.is_active ?? true,
    is_priority: api.is_priority ?? false,
    category_code: api.category_code ?? "",
    category_name: api.category_name ?? "",
    category_color: api.category_color ?? null,
  };
}

export function mapApiBuildings(apiList: ApiBuilding[]): Building[] {
  return apiList.map(mapApiBuildingToBuilding);
}