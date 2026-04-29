export type Building = {
  id: string;
  code: string;
  name: string;
  slug: string;
  description: string | null;
  model_node_name: string;
  x: number | null;
  y: number | null;
  z: number | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  is_priority: boolean;
  category_code: string;
  category_name: string;
  category_color: string | null;
};

export type BuildingCategory = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  color_hex: string | null;
  icon_name: string | null;
  is_active: boolean;
};

export type BuildingImageType = "photo" | "entrance" | "map" | "floorplan";

export type BuildingImage = {
  id: string;
  building_id: string;
  image_url: string;
  image_type: BuildingImageType;
  title: string | null;
  description: string | null;
  is_cover: boolean;
  sort_order: number;
  is_active: boolean;
};

export type CreateBuildingInput = {
  code: string;
  name: string;
  slug: string;
  description?: string | null;
  model_node_name: string;
  x?: number | null;
  y?: number | null;
  z?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  is_active?: boolean;
  is_priority?: boolean;
  category_code: string;
};

export type UpdateBuildingInput = Partial<CreateBuildingInput>;