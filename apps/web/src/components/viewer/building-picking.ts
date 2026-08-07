import type { Object3D } from "three";
import type { Building } from "../../features/buildings/types/building";
import { resolveGlbName, toRuntimeGlbName } from "./glb-utils";

export const BUILDING_HIT_TARGET_KEY = "buildingInteractionId";

// Una malla del GLB puede representar varios registros funcionales (por
// ejemplo, un edificio con aulas y servicios distintos). Agrupar conserva
// todos los registros; elegir un único "ganador" hacía que los demás nunca
// recibieran etiqueta, sin importar el zoom o la orientación de la cámara.
export function groupActiveBuildingsByModelNode(
  buildings: readonly Building[],
): Map<string, Building[]> {
  const groups = new Map<string, Building[]>();
  for (const building of buildings) {
    if (!building.is_active || !building.model_node_name) continue;
    const glbName = resolveGlbName(building.model_node_name);
    const group = groups.get(glbName);
    if (group) group.push(building);
    else groups.set(glbName, [building]);
  }
  return groups;
}

function normalizeNodeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

function addBuildingKey(
  map: Map<string, Building>,
  key: string,
  building: Building,
) {
  if (!key) return;
  map.set(key, building);
}

// Único criterio para decidir qué edificio representa un nodo GLB compartido
// por varios registros (ej. Dirección y Servicios Escolares son la misma
// malla). Prioritario gana; si ninguno lo es (o ambos), gana el código menor
// alfabéticamente — determinista, sin depender del orden de llegada de la
// API. Antes esta función y la generación de etiquetas en CampusViewer
// usaban criterios de desempate distintos ("primero que llega" aquí vs.
// alfabético allá): al hover/clic seleccionabas un edificio pero la
// etiqueta visible mostraba el nombre del otro miembro del grupo — mismo
// nodo, "ganador" distinto según qué código decidía.
export function pickPrimaryBuilding(group: readonly Building[]): Building {
  return [...group].sort((a, b) => {
    if (a.is_priority !== b.is_priority) return a.is_priority ? -1 : 1;
    return a.code.localeCompare(b.code);
  })[0];
}

// Registra tanto el nombre guardado en la BD como la forma que GLTFLoader
// crea en tiempo de ejecución, apuntando siempre al mismo "ganador" que usa
// la etiqueta 2D del edificio (ver `pickPrimaryBuilding`).
export function buildNameToBuildingMap(
  buildings: Building[],
): Map<string, Building> {
  const map = new Map<string, Building>();
  const groups = groupActiveBuildingsByModelNode(buildings);
  for (const [glbName, group] of groups) {
    const primary = pickPrimaryBuilding(group);
    const trimmed = normalizeNodeName(glbName);
    const runtime = toRuntimeGlbName(glbName);
    addBuildingKey(map, trimmed, primary);
    addBuildingKey(map, runtime, primary);
    addBuildingKey(map, trimmed.toLowerCase(), primary);
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
): boolean {
  return currentBuildingId === leavingBuildingId;
}

// El hover/foco es una orden explícita del usuario y debe prevalecer desde el
// primer render. Los sets de colisión se recalculan después de medir el DOM;
// no permitir que su resultado anterior mantenga invisible la etiqueta activa.
export function shouldHideBuildingLabel(
  isExpanded: boolean,
  collisionHidden: boolean,
  overlayHidden: boolean,
  alwaysVisible = false,
): boolean {
  if (alwaysVisible) return false;
  return !isExpanded && (collisionHidden || overlayHidden);
}
