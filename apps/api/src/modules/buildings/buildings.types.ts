import type { RowDataPacket } from "mysql2";

export interface BuildingRow extends RowDataPacket {
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
  is_active: boolean | number;
  is_priority: boolean | number;
  deleted_at: string | null;
  category_code: string;
  category_name: string;
  category_color: string | null;
  cover_image_url: string | null;
}

export interface BuildingImageRow extends RowDataPacket {
  id: string;
  image_url: string;
  image_type: string;
  title: string | null;
  description: string | null;
  is_cover: boolean | number;
  sort_order: number;
  is_active: boolean | number;
}