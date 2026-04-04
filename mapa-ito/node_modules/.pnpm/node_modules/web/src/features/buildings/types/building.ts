export type BuildingCategory =
  | "aulas"
  | "laboratorio"
  | "administrativo"
  | "servicio"
  | "biblioteca"
  | "otro";

export interface Building {
  id: string;
  code: string;
  name: string;
  category: BuildingCategory;
  description: string;
  modelNodeName: string;
  isActive: boolean;
}