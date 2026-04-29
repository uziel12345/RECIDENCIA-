import {
  mapApiBuildings,
  type ApiBuilding,
} from "../features/buildings/mappers/building.mapper";
import {
  getBuildingByIdApi,
  getBuildingsApi,
  type Building,
} from "@ito-map/shared";
import { buildings as localBuildings } from "../features/buildings/data/buildings";

/**
 * Categoría → nombre legible y color asociado.
 * Usado para convertir los datos locales antiguos al formato del API.
 */
const CATEGORY_META: Record<string, { name: string; color: string }> = {
  administrativo: { name: "Administrativo", color: "#1e40af" },
  aulas: { name: "Aulas", color: "#0f766e" },
  laboratorio: { name: "Laboratorio", color: "#b45309" },
  servicio: { name: "Servicios", color: "#9d174d" },
  biblioteca: { name: "Biblioteca", color: "#0369a1" },
  otro: { name: "Otros", color: "#475569" },
};

/**
 * Convierte los edificios locales antiguos al formato del API.
 * Esto permite conservar fallback local si el backend no está disponible.
 */
function localToApi(): ApiBuilding[] {
  return localBuildings.map((building) => {
    const meta = CATEGORY_META[building.category] ?? CATEGORY_META.otro;

    return {
      id: building.id,
      code: building.code,
      name: building.name,
      slug: building.id,
      description: building.description,
      model_node_name: building.modelNodeName,
      x: null,
      y: null,
      z: null,
      latitude: null,
      longitude: null,
      is_active: building.isActive,
      is_priority: false,
      category_code: building.category,
      category_name: meta.name,
      category_color: meta.color,
    };
  });
}

/**
 * Obtiene todos los edificios desde el cliente API compartido.
 * Si la API falla, usa los datos locales como respaldo.
 */
export async function getBuildings(): Promise<Building[]> {
  try {
    return await getBuildingsApi();
  } catch (error) {
    console.warn(
      "[buildings.service] API no disponible, usando datos locales.",
      error
    );

    return mapApiBuildings(localToApi());
  }
}

/**
 * Obtiene un edificio por id desde el cliente API compartido.
 * Si la API falla, busca el edificio en los datos locales.
 */
export async function getBuildingById(id: string): Promise<Building | null> {
  try {
    return await getBuildingByIdApi(id);
  } catch (error) {
    console.warn(
      "[buildings.service] API no disponible, buscando en datos locales.",
      error
    );

    const all = mapApiBuildings(localToApi());
    return all.find((building) => building.id === id) || null;
  }
}

/**
 * Busca edificios por nombre, código, categoría o descripción.
 */
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