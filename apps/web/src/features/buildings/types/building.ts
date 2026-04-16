// building.ts

export type BuildingCategory =
  | "administrativo"
  | "biblioteca"
  | "laboratorio"
  | "servicio"
  | "aulas"
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