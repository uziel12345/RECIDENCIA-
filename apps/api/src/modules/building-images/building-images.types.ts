import type { RowDataPacket } from "mysql2";

export interface BuildingImageRow extends RowDataPacket {
  id: string;
  building_id: string;
  image_url: string;
  image_type: string;
  title: string | null;
  description: string | null;
  is_cover: number | boolean;
  sort_order: number;
  is_active: number | boolean;
  created_at: Date;
  updated_at: Date;
}

export type CreateBuildingImageInput = {
  building_id: string;
  image_url: string;
  image_type: string;
  title: string | null;
  description: string | null;
  is_cover: boolean;
  sort_order: number;
};