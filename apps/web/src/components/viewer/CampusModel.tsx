import { useMemo, useRef } from "react";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { Mesh, MeshStandardMaterial, type Object3D } from "three";
import type { Material } from "three";
import { useBuildingStore } from "../../store/building-store";
import { resolveGlbName, toRuntimeGlbName } from "./glb-utils";
import type { Building } from "../../features/buildings/types/building";
import { useCampusGltf, MODEL_PATH } from "./useCampusGltf";
import { useDragAwareClick } from "./useDragAwareClick";

export { MODEL_PATH };

function normalizeNodeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

// El GLB contiene varias instancias exportadas dos veces con la misma
// geometría, material y matriz mundial. La GPU intenta dibujar ambas caras en
// exactamente la misma profundidad y alterna cuál gana (z-fighting), que se
// percibe como parpadeo al mover la cámara. Conservar solo la primera instancia
// exacta no elimina ningún detalle visible y evita ese conflicto desde la raíz.
function hideExactDuplicateMeshes(scene: Object3D) {
  scene.updateMatrixWorld(true);
  const seen = new Set<string>();

  scene.traverse((child) => {
    if (!(child instanceof Mesh) || !child.visible) return;
    const materials = Array.isArray(child.material)
      ? child.material.map((material) => material.uuid).join(",")
      : child.material.uuid;
    const matrix = child.matrixWorld.elements
      .map((value) => value.toFixed(5))
      .join(",");
    const key = `${child.geometry.uuid}|${materials}|${matrix}`;

    if (seen.has(key)) {
      child.visible = false;
      return;
    }
    seen.add(key);
  });
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
  hoverEnabled = false,
  onHoverBuilding,
}: {
  buildings?: Building[];
  /** true mientras el editor de trazado de admin está activo — un tap ahí
   *  coloca nodos/caminos, no debe seleccionar el edificio debajo. */
  selectionDisabled?: boolean;
  hoverEnabled?: boolean;
  onHoverBuilding?: (
    hover: { buildingId: string; point: [number, number, number] } | null
  ) => void;
}) {
  const { scene } = useCampusGltf();
  const maxAnisotropy = useThree((state) => state.gl.capabilities.getMaxAnisotropy());
  const setSelectedBuilding = useBuildingStore((s) => s.setSelectedBuilding);
  const hoveredBuildingIdRef = useRef<string | null>(null);

  useMemo(() => {
    hideExactDuplicateMeshes(scene);

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

        // Caras que en SketchUp nunca recibieron un material (frecuente en
        // este modelo: ~80% de las caras de cada edificio, confirmado
        // auditando el .skp fuente) llegan al GLB sin índice de material.
        // GLTFLoader les asigna su material por defecto: blanco pero 100%
        // metálico y 100% rugoso (metalness:1, roughness:1). Un metal no
        // tiene componente difusa — solo se ve por reflejos de un mapa de
        // entorno, que este visor no tiene — así que se renderiza negro sin
        // importar la iluminación de la escena. Se detecta con certeza
        // porque los materiales reales exportados desde SketchUp usan
        // metalness/roughness 0.5 parejo (ninguno real cae en 1/1) y no
        // tienen mapa de color. Se corrige a un acabado neutro no-metálico
        // en vez de negro.
        if (
          mat instanceof MeshStandardMaterial &&
          mat.metalness === 1 &&
          mat.roughness === 1 &&
          !mat.map
        ) {
          mat.metalness = 0;
          mat.roughness = 0.9;
        }

        // Mantener los mapas de color originales del GLB y mejorar su nitidez
        // cuando se observan en ángulo (pisos, fachadas y techos lejanos).
        // GLTFLoader ya configura correctamente colorSpace y coordenadas UV;
        // aquí solo elevamos el filtrado dentro del límite real de la GPU.
        if (mat instanceof MeshStandardMaterial && mat.map) {
          mat.map.anisotropy = Math.min(8, maxAnisotropy);
          mat.map.needsUpdate = true;
        }

        mat.needsUpdate = true;
      }
    });
  }, [scene, maxAnisotropy]);

  const nameToBuilding = useMemo(
    () => buildNameToBuildingMap(buildings),
    [buildings]
  );

  function handleBuildingClick(event: ThreeEvent<MouseEvent>) {
    if (selectionDisabled) return;
    const building = findBuildingForObject(event.object, nameToBuilding);
    if (!building) return;
    // No dejar que el clic siga hacia capas detrás (ej. el plano de
    // teletransporte del modo aéreo) — tocar un edificio siempre selecciona
    // ese edificio, nunca ambas cosas a la vez.
    event.stopPropagation();
    setSelectedBuilding(building);
  }

  const { handlePointerDown, handleClick } = useDragAwareClick(handleBuildingClick);

  function handlePointerMove(event: ThreeEvent<PointerEvent>) {
    if (!hoverEnabled || selectionDisabled) return;
    const building = findBuildingForObject(event.object, nameToBuilding);
    const nextId = building?.id ?? null;
    if (!building) {
      if (hoveredBuildingIdRef.current === null) return;
      hoveredBuildingIdRef.current = null;
      onHoverBuilding?.(null);
      return;
    }
    hoveredBuildingIdRef.current = nextId;
    onHoverBuilding?.({
      buildingId: building.id,
      point: [event.point.x, event.point.y + 8, event.point.z],
    });
  }

  function handlePointerLeave() {
    if (!hoverEnabled) return;
    if (hoveredBuildingIdRef.current === null) return;
    hoveredBuildingIdRef.current = null;
    onHoverBuilding?.(null);
  }

  return (
    <primitive
      object={scene}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    />
  );
}
