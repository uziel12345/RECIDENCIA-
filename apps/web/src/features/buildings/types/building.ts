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