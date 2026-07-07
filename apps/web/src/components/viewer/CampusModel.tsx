import { useMemo } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { Mesh, type Object3D } from "three";
import type { Material } from "three";
import { useBuildingStore } from "../../store/building-store";
import { resolveGlbName, toRuntimeGlbName } from "./glb-utils";
import type { Building } from "../../features/buildings/types/building";
import { useCampusGltf, MODEL_PATH } from "./useCampusGltf";

export { MODEL_PATH };

function normalizeNodeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

// Registra un edificio bajo varias formas de su nombre de nodo: la forma
// "cruda" (puede coincidir si el GLB preservó el nombre exacto, con puntos y
// espacios), la forma saneada por Three.js/GLTFLoader (espacios -> "_",
// puntos eliminados — la que realmente tienen los nodos en la escena
// cargada), y la versión en minúsculas de ambas por si difieren en mayúsculas.
// Sin esto, cualquier edificio cuyo nombre de nodo tenga puntos o espacios
// (ej. "D.P.I") nunca se encuentra al recorrer los ancestros de un clic.
function addBuildingKeys(
  map: Map<string, Building>,
  key: string,
  building: Building
) {
  if (!key) return;
  const existing = map.get(key);
  if (!existing || (building.is_priority && !existing.is_priority)) {
    map.set(key, building);
  }
}

function buildNameToBuildingMap(buildings: Building[]): Map<string, Building> {
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

// Sube por los ancestros del objeto tocado hasta encontrar uno cuyo nombre
// resuelva a un edificio conocido (el clic puede caer en una malla hija
// varios niveles debajo del nodo con el nombre del edificio).
function findBuildingForObject(
  object: Object3D,
  nameToBuilding: Map<string, Building>
): Building | undefined {
  let node: Object3D | null = object;
  while (node) {
    const trimmed = normalizeNodeName(node.name);
    const match = nameToBuilding.get(trimmed) ?? nameToBuilding.get(trimmed.toLowerCase());
    if (match) return match;
    node = node.parent;
  }
  return undefined;
}

export function CampusModel({
  buildings = [],
  selectionDisabled = false,
}: {
  buildings?: Building[];
  /** true mientras el editor de trazado de admin está activo — un tap ahí
   *  coloca nodos/caminos, no debe seleccionar el edificio debajo. */
  selectionDisabled?: boolean;
}) {
  const { scene } = useCampusGltf();
  const setSelectedBuilding = useBuildingStore((s) => s.setSelectedBuilding);

  useMemo(() => {
    scene.traverse((child) => {
      if (child.name.startsWith("NavMesh")) {
        child.visible = false;
        return;
      }

      if (!(child instanceof Mesh)) return;

      const mats: Material[] = Array.isArray(child.material)
        ? child.material
        : [child.material];

      for (const mat of mats) {
        if (!mat) continue;
        mat.dithering = true;
        mat.needsUpdate = true;
      }
    });
  }, [scene]);

  const nameToBuilding = useMemo(
    () => buildNameToBuildingMap(buildings),
    [buildings]
  );

  function handleClick(event: ThreeEvent<MouseEvent>) {
    if (selectionDisabled) return;
    const building = findBuildingForObject(event.object, nameToBuilding);
    if (!building) return;
    // No dejar que el clic siga hacia capas detrás (ej. el plano de
    // teletransporte del modo aéreo) — tocar un edificio siempre selecciona
    // ese edificio, nunca ambas cosas a la vez.
    event.stopPropagation();
    setSelectedBuilding(building);
  }

  return <primitive object={scene} onClick={handleClick} />;
}
