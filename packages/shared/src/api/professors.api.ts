import { apiGet } from "./client.js";
import type { Professor } from "../types/academic.types.js";

export function getProfessorsApi(): Promise<Professor[]> {
  return apiGet<Professor[]>("/professors");
}
