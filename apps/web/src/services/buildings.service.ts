import { mapApiBuildings } from "../mappers/building.mapper";
import type { Building } from "../features/buildings/types/building";

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

/**
 * Base URL desde variables de entorno
 * Ejemplo en Vite:
 * VITE_API_URL=http://localhost:3001/api
 */
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

/* ============================= */
/*  GET ALL BUILDINGS */
/* ============================= */
export async function getBuildings(): Promise<Building[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/buildings`);

    if (!response.ok) {
      throw new Error("Error al obtener edificios");
    }

    const payload: ApiResponse<unknown[]> = await response.json();

    return mapApiBuildings(payload.data);
  } catch (error) {
    console.error("Error en getBuildings:", error);
    return [];
  }
}

/* ============================= */
/* GET BUILDING BY ID */
/* ============================= */
export async function getBuildingById(id: string): Promise<Building | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/buildings/${id}`);

    if (!response.ok) {
      throw new Error("Edificio no encontrado");
    }

    const payload: ApiResponse<unknown> = await response.json();

    const [mapped] = mapApiBuildings([payload.data]);

    return mapped || null;
  } catch (error) {
    console.error("Error en getBuildingById:", error);
    return null;
  }
}


/**
 * Tu backend actual no tiene /buildings/search
 * Por ahora hacemos la búsqueda en frontend.
 */
export async function searchBuildings(query: string): Promise<Building[]> {
  try {
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
  } catch (error) {
    console.error("Error en searchBuildings:", error);
    return [];
  }
}