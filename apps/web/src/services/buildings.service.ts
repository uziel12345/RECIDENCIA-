import {
  mapApiBuildings,
  type ApiBuilding,
} from "../features/buildings/mappers/building.mapper";
import type { Building } from "../features/buildings/types/building";
import { buildings as localBuildings } from "../features/buildings/data/buildings";

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

/**
 * Categoría → nombre legible y color asociado.
 * Usado para los badges de categoría en la UI.
 */
const CATEGORY_META: Record<
  string,
  { name: string; color: string }
> = {
  administrativo: { name: "Administrativo", color: "#1e40af" },
  aulas: { name: "Aulas", color: "#0f766e" },
  laboratorio: { name: "Laboratorio", color: "#b45309" },
  servicio: { name: "Servicios", color: "#9d174d" },
  biblioteca: { name: "Biblioteca", color: "#0369a1" },
  otro: { name: "Otros", color: "#475569" },
};

function localToApi(): ApiBuilding[] {
  return localBuildings.map((b) => {
    const meta = CATEGORY_META[b.category] ?? CATEGORY_META.otro;
    return {
      id: b.id,
      code: b.code,
      name: b.name,
      slug: b.id,
      description: b.description,
      model_node_name: b.modelNodeName,
      x: null,
      y: null,
      z: null,
      latitude: null,
      longitude: null,
      is_active: b.isActive,
      is_priority: false,
      category_code: b.category,
      category_name: meta.name,
      category_color: meta.color,
    };
  });
}

export async function getBuildings(): Promise<Building[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/buildings`, {
      signal: AbortSignal.timeout(2500),
    });

    if (!response.ok) {
      throw new Error("Error al obtener edificios");
    }

    const payload: ApiResponse<ApiBuilding[]> = await response.json();
    return mapApiBuildings(payload.data);
  } catch (error) {
    console.warn(
      "[buildings.service] API no disponible, usando datos locales.",
      error
    );
    return mapApiBuildings(localToApi());
  }
}

export async function getBuildingById(id: string): Promise<Building | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/buildings/${id}`, {
      signal: AbortSignal.timeout(2500),
    });

    if (!response.ok) {
      throw new Error("Edificio no encontrado");
    }

    const payload: ApiResponse<ApiBuilding> = await response.json();
    const [mapped] = mapApiBuildings([payload.data]);
    return mapped || null;
  } catch (error) {
    console.warn(
      "[buildings.service] API no disponible, buscando en datos locales.",
      error
    );
    const all = mapApiBuildings(localToApi());
    return all.find((b) => b.id === id) || null;
  }
}

export async function searchBuildings(query: string): Promise<Building[]> {
  const buildings = await getBuildings();
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return buildings;
  }

  return buildings.filter((building) => {
    return (
      building.name.toLowerCase().includes(normalizedQuery) ||
      building.code.toLowerCase().includes(normalizedQuery) ||
      building.category_name.toLowerCase().includes(normalizedQuery) ||
      (building.description?.toLowerCase().includes(normalizedQuery) ?? false)
    );
  });
}
