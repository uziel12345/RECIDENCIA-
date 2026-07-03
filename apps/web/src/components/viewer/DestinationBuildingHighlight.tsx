import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import { useBuildingStore } from "../../store/building-store";
import { useBuildingGlbStore } from "../../store/building-glb-store";
import { resolveGlbName } from "./glb-utils";

const MODEL_PATH = "/models/campus.glb";

// Naranja para el destino de ruta activa
const ROUTE_COLOR = new THREE.Color(0xf97316);
// Azul ITO para edificio seleccionado sin ruta
const SELECT_COLOR = new THREE.Color(0x2563eb);

const BEACON_HEIGHT = 28;
// Redibuja a una tasa fija en vez de en cada frame disponible, para no anular
// el ahorro de frameloop="demand" mientras hay un glow/beacon/pin animado.
const INVALIDATE_FPS = 24;

// ── Glow en el mesh ────────────────────────────────────────────────────────────
//
// Los edificios en el GLB pueden ser THREE.Group (con Meshes hijos) o un solo
// THREE.Mesh. Buscamos por nombre en cualquier Object3D y luego aplicamos el
// glow a TODOS los Meshes dentro de ese nodo.

function useBuildingGlow(
  modelNodeName: string | null | undefined,
  scene: THREE.Group,
  color: THREE.Color,
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
      cloned.color.set(color);
      cloned.emissive.set(color);
      cloned.emissiveIntensity = 0.4;
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
    if (!modelNodeName) return;
    const id = setInterval(() => invalidate(), 1000 / INVALIDATE_FPS);
    return () => clearInterval(id);
  }, [modelNodeName, invalidate]);

  useFrame((_, delta) => {
    if (!clonedsRef.current.length) return;
    elapsed.current += delta;
    const pulse = (Math.sin(elapsed.current * 2.8) + 1) / 2;
    const intensity = 0.3 + pulse * 0.7;
    for (const mat of clonedsRef.current) {
      mat.emissiveIntensity = intensity;
    }
  });
}

// ── Beacon naranja para destino de ruta ────────────────────────────────────────

function DestinationBeacon({ x, z, name }: { x: number; z: number; name: string }) {
  const pillarRef = useRef<THREE.Mesh>(null);
  const ringRef   = useRef<THREE.Mesh>(null);
  const elapsed   = useRef(0);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    const id = setInterval(() => invalidate(), 1000 / INVALIDATE_FPS);
    return () => clearInterval(id);
  }, [invalidate]);

  useFrame((_, delta) => {
    elapsed.current += delta;
    const t = (Math.sin(elapsed.current * 3) + 1) / 2;

    if (pillarRef.current) {
      (pillarRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4 + t * 0.5;
    }
    if (ringRef.current) {
      const scale = 1 + t * 0.35;
      ringRef.current.scale.set(scale, scale, scale);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.55 - t * 0.3;
    }
  });

  const pillarY = BEACON_HEIGHT / 2;
  const coneY   = BEACON_HEIGHT + 3.5;

  return (
    <group position={[x, 0, z]}>
      <mesh ref={pillarRef} position={[0, pillarY, 0]}>
        <cylinderGeometry args={[0.35, 0.35, BEACON_HEIGHT, 8]} />
        <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.6} transparent opacity={0.88} />
      </mesh>

      <mesh position={[0, coneY, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[2.2, 4.5, 8]} />
        <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.8} />
      </mesh>

      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.3, 0]}>
        <ringGeometry args={[5, 7.5, 32]} />
        <meshBasicMaterial color="#f97316" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>

      <Html position={[0, coneY + 6, 0]} center distanceFactor={90} occlude zIndexRange={[8, 0]}>
        <div style={{
          background: "#f97316", color: "#fff", padding: "5px 12px",
          borderRadius: 999, fontSize: 12, fontWeight: 800, whiteSpace: "nowrap",
          boxShadow: "0 6px 16px rgba(0,0,0,0.28)", fontFamily: "Inter, sans-serif",
          letterSpacing: "0.01em", pointerEvents: "none",
        }}>
          📍 {name}
        </div>
      </Html>
    </group>
  );
}

// ── Pin azul para edificio seleccionado sin ruta ───────────────────────────────

function SelectionPin({ x, z }: { x: number; z: number }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const elapsed = useRef(0);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    const id = setInterval(() => invalidate(), 1000 / INVALIDATE_FPS);
    return () => clearInterval(id);
  }, [invalidate]);

  useFrame((_, delta) => {
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
        <meshBasicMaterial color="#2563eb" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>

      {/* Pillar delgado */}
      <mesh position={[0, PIN_Y / 2, 0]}>
        <cylinderGeometry args={[0.22, 0.22, PIN_Y, 6]} />
        <meshStandardMaterial color="#2563eb" emissive="#2563eb" emissiveIntensity={0.5} transparent opacity={0.75} />
      </mesh>

      {/* Esfera */}
      <mesh position={[0, PIN_Y, 0]}>
        <sphereGeometry args={[1.8, 20, 20]} />
        <meshStandardMaterial color="#2563eb" emissive="#2563eb" emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

export function DestinationBuildingHighlight() {
  const routeDestination = useBuildingStore((s) => s.routeDestination);
  const selectedBuilding  = useBuildingStore((s) => s.selectedBuilding);
  const glbPositions      = useBuildingGlbStore((s) => s.positions);
  const { scene } = useGLTF(MODEL_PATH);

  // Cuando hay ruta activa: glow naranja en el destino de ruta
  // Cuando solo hay selección: glow azul en el edificio seleccionado
  const glowTarget     = routeDestination ?? selectedBuilding;
  const glowColor      = routeDestination ? ROUTE_COLOR : SELECT_COLOR;

  useBuildingGlow(glowTarget?.model_node_name, scene as unknown as THREE.Group, glowColor);

  // ── Beacon/Pin ─────────────────────────────────────────────────────────────

  if (routeDestination) {
    const glbPos = glbPositions[routeDestination.id];
    const x = glbPos?.x ?? routeDestination.x;
    const z = glbPos?.z ?? routeDestination.z;
    if (x == null || z == null) return null;
    return <DestinationBeacon x={x} z={z} name={routeDestination.name} />;
  }

  if (selectedBuilding) {
    const glbPos = glbPositions[selectedBuilding.id];
    const x = glbPos?.x ?? selectedBuilding.x;
    const z = glbPos?.z ?? selectedBuilding.z;
    if (x == null || z == null) return null;
    return <SelectionPin x={x} z={z} />;
  }

  return null;
}
