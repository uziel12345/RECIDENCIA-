import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useBuildingStore } from "../../store/building-store";
import { useBuildingGlbStore } from "../../store/building-glb-store";
import { resolveGlbName } from "./glb-utils";
import { useIsMobile } from "../../hooks/useIsMobile";
import { getCategoryAccent } from "../ui/categoryAccent";
import type { Building } from "../../features/buildings/types/building";
import { useCampusGltf } from "./useCampusGltf";

// Color de acento de la categoría del edificio (fallback azul ITO si no hay categoría)
function getSelectionColorHex(
  building: Pick<Building, "category_name" | "category_color"> | null | undefined,
): string {
  if (!building) return "#2563eb";
  return building.category_color || getCategoryAccent(building.category_name).fg;
}

// Escritorio redibuja a una tasa fija en vez de en cada frame disponible, para
// no anular el ahorro de frameloop="demand". En móvil los indicadores quedan
// estáticos para evitar shimmering y trabajo GPU continuo en vista aérea.
const INVALIDATE_FPS_DESKTOP = 24;

// ── Glow en el mesh ────────────────────────────────────────────────────────────
//
// Los edificios en el GLB pueden ser THREE.Group (con Meshes hijos) o un solo
// THREE.Mesh. Buscamos por nombre en cualquier Object3D y luego aplicamos el
// glow a TODOS los Meshes dentro de ese nodo.

function useBuildingGlow(
  modelNodeName: string | null | undefined,
  scene: THREE.Group,
  color: THREE.Color,
  isMobile: boolean,
) {
  const meshesRef    = useRef<THREE.Mesh[]>([]);
  const originalsRef = useRef<(THREE.Material | THREE.Material[])[]>([]);
  const clonedsRef   = useRef<THREE.MeshStandardMaterial[]>([]);
  const elapsed      = useRef(0);

  useEffect(() => {
    // Restaurar materiales anteriores
    meshesRef.current.forEach((mesh, i) => {
      mesh.material = originalsRef.current[i];
    });
    clonedsRef.current.forEach((m) => m.dispose());
    meshesRef.current   = [];
    originalsRef.current = [];
    clonedsRef.current  = [];
    elapsed.current     = 0;

    if (!modelNodeName) return;

    const glbName        = resolveGlbName(modelNodeName);
    const normalizedName = glbName.trim().replace(/\s+/g, " ");

    // Paso 1: encontrar el nodo por nombre (Group O Mesh — sin filtrar por tipo)
    let target: THREE.Object3D | null = null;
    scene.traverse((child) => {
      if (target) return;
      const n = child.name.trim().replace(/\s+/g, " ");
      if (n === normalizedName || child.name === glbName) {
        target = child;
      }
    });

    if (!target) return;

    // Paso 2: aplicar glow a todos los Meshes dentro del nodo encontrado
    (target as THREE.Object3D).traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;

      const original = child.material as THREE.Material | THREE.Material[];
      meshesRef.current.push(child);
      originalsRef.current.push(original);

      const src = Array.isArray(original)
        ? (original[0] as THREE.MeshStandardMaterial)
        : (original as THREE.MeshStandardMaterial);
      const cloned = src.clone() as THREE.MeshStandardMaterial;
      // No tocar cloned.color: conserva la textura/color real del edificio
      // (techo rojo, paredes blancas). El glow es un tinte emissive aditivo
      // encima, no un reemplazo — así el edificio sigue siendo identificable.
      cloned.emissive.set(color);
      cloned.emissiveIntensity = 0.3;
      clonedsRef.current.push(cloned);
      child.material = cloned;
    });

    return () => {
      meshesRef.current.forEach((mesh, i) => {
        mesh.material = originalsRef.current[i];
      });
      clonedsRef.current.forEach((m) => m.dispose());
      meshesRef.current    = [];
      originalsRef.current = [];
      clonedsRef.current   = [];
    };
  }, [modelNodeName, scene, color]);

  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    // En móvil el resaltado queda estático. El pulso de baja frecuencia sobre
    // muchas caras pequeñas se percibe como parpadeo en la vista aérea.
    if (!modelNodeName || isMobile) return;
    const fps = INVALIDATE_FPS_DESKTOP;
    const id = setInterval(() => invalidate(), 1000 / fps);
    return () => clearInterval(id);
  }, [modelNodeName, isMobile, invalidate]);

  useFrame((_, delta) => {
    if (isMobile || !clonedsRef.current.length) return;
    elapsed.current += delta;
    const pulse = (Math.sin(elapsed.current * 2.8) + 1) / 2;
    const intensity = 0.22 + pulse * 0.5;
    for (const mat of clonedsRef.current) {
      // Three.js anima materiales mediante mutación imperativa dentro del frame.
      // eslint-disable-next-line react-hooks/immutability
      mat.emissiveIntensity = intensity;
    }
  });
}

// ── Pin de edificio seleccionado ────────────────────────────────────────────────

function SelectionPin({
  x,
  z,
  color,
  isMobile,
}: {
  x: number;
  z: number;
  color: string;
  isMobile: boolean;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const elapsed = useRef(0);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (isMobile) return;
    const fps = INVALIDATE_FPS_DESKTOP;
    const id = setInterval(() => invalidate(), 1000 / fps);
    return () => clearInterval(id);
  }, [isMobile, invalidate]);

  useFrame((_, delta) => {
    if (isMobile) return;
    elapsed.current += delta;
    if (!ringRef.current) return;
    const t = (Math.sin(elapsed.current * 2.5) + 1) / 2;
    const scale = 1 + t * 0.2;
    ringRef.current.scale.set(scale, scale, scale);
    (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.4 - t * 0.15;
  });

  const PIN_Y = 14;

  return (
    <group position={[x, 0, z]}>
      {/* Ring pulsante en el suelo */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
        <ringGeometry args={[4, 6, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>

      {/* Pillar delgado */}
      <mesh position={[0, PIN_Y / 2, 0]}>
        <cylinderGeometry args={[0.22, 0.22, PIN_Y, 6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.75} />
      </mesh>

      {/* Esfera */}
      <mesh position={[0, PIN_Y, 0]}>
        <sphereGeometry args={[1.8, 20, 20]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

export function DestinationBuildingHighlight() {
  const selectedBuilding  = useBuildingStore((s) => s.selectedBuilding);
  const glbPositions      = useBuildingGlbStore((s) => s.positions);
  const { scene } = useCampusGltf();
  const isMobile = useIsMobile();

  const selectionColorHex = useMemo(
    () => getSelectionColorHex(selectedBuilding),
    [selectedBuilding],
  );
  const glowColor = useMemo(
    () => new THREE.Color(selectionColorHex),
    [selectionColorHex],
  );

  useBuildingGlow(selectedBuilding?.model_node_name, scene as unknown as THREE.Group, glowColor, isMobile);

  // glbPositions (useBuildingGlbStore, publicado por BuildingLabels en
  // CampusViewer.tsx) ya cubre a TODOS los buildings activos con
  // model_node_name, no solo al que "gana" la etiqueta 2D cuando dos
  // comparten el mismo nodo físico — building.x/z solo es fallback para el
  // instante antes de que cargue la escena.

  if (selectedBuilding) {
    const glbPos = glbPositions[selectedBuilding.id];
    const x = glbPos?.x ?? selectedBuilding.x;
    const z = glbPos?.z ?? selectedBuilding.z;
    if (x == null || z == null) return null;
    return <SelectionPin x={x} z={z} color={selectionColorHex} isMobile={isMobile} />;
  }

  return null;
}
