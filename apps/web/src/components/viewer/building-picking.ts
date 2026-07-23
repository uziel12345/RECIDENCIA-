import type { Object3D } from "three";
import type { Building } from "../../features/buildings/types/building";
import { resolveGlbName, toRuntimeGlbName } from "./glb-utils";

export const BUILDING_HIT_TARGET_KEY = "buildingInteractionId";

function normalizeNodeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

function addBuildingKeys(
  map: Map<string, Building>,
  key: string,
  building: Building,
) {
  if (!key) return;
  const existing = map.get(key);
  if (!existing || (building.is_priority && !existing.is_priority)) {
    map.set(key, building);
  }
}

// Registra tanto el nombre guardado en la BD como la forma que GLTFLoader
// crea en tiempo de ejecución. Si dos registros comparten nodo, el marcado
// como prioritario representa a esa geometría en el mapa.
export function buildNameToBuildingMap(
  buildings: Building[],
): Map<string, Building> {
  const map = new Map<string, Building>();
  for (const building of buildings) {
    if (!building.is_active || !building.model_node_name) continue;
    const glbName = resolveGlbName(building.model_node_name);
    const trimmed = normalizeNodeName(glbName);
    const runtime = toRuntimeGlbName(glbName);
    addBuildingKeys(map, trimmed, building);
    addBuildingKeys(map, runtime, building);
    addBuildingKeys(map, trimmed.toLowerCase(), building);
  }
  return map;
}

// El rayo suele tocar una malla hija; el nombre que identifica al edificio
// puede estar varios niveles arriba en la jerarquía del GLB.
export function findBuildingForObject(
  object: Object3D,
  nameToBuilding: Map<string, Building>,
): Building | undefined {
  let node: Object3D | null = object;
  while (node) {
    const trimmed = normalizeNodeName(node.name);
    const match =
      nameToBuilding.get(trimmed) ??
      nameToBuilding.get(trimmed.toLowerCase());
    if (match) return match;
    node = node.parent;
  }
  return undefined;
}

export function findExactBuildingFromIntersections(
  intersections: ReadonlyArray<{ object: Object3D }>,
  nameToBuilding: Map<string, Building>,
): Building | undefined {
  for (const intersection of intersections) {
    if (intersection.object.userData[BUILDING_HIT_TARGET_KEY]) continue;
    const building = findBuildingForObject(intersection.object, nameToBuilding);
    if (building) return building;
  }
  return undefined;
}

// Un pointerout de una caja solapada no debe cerrar el edificio que acaba de
// ganar el hover. Esto ocurre con frecuencia entre edificios contiguos: sale
// A, entra B y ambos eventos llegan en el mismo frame.
export function shouldClearHoverOnPointerOut(
  leavingBuildingId: string,
  currentBuildingId: string | null,
  pendingBuildingId: string | null,
): boolean {
  if (
    pendingBuildingId !== null &&
    pendingBuildingId !== leavingBuildingId
  ) {
    return false;
  }

  return (
    currentBuildingId === leavingBuildingId ||
    pendingBuildingId === leavingBuildingId
  );
}
