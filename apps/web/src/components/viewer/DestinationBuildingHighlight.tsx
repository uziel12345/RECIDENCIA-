import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import { useBuildingStore } from "../../store/building-store";
import { resolveGlbName } from "./glb-utils";

const MODEL_PATH = "/models/campus.glb";
const PULSE_COLOR = new THREE.Color(0xf97316); // naranja-500
const BEACON_HEIGHT = 28;

// ── Glow en el mesh ────────────────────────────────────────────────────────────

function useBuildingGlow(modelNodeName: string | null | undefined, scene: THREE.Group) {
  const meshRef = useRef<THREE.Mesh | null>(null);
  const originalRef = useRef<THREE.Material | null>(null);
  const clonedRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const elapsed = useRef(0);

  useEffect(() => {
    // Cleanup previous highlight before applying the new one
    if (meshRef.current && originalRef.current) {
      meshRef.current.material = originalRef.current;
      clonedRef.current?.dispose();
      clonedRef.current = null;
      meshRef.current = null;
      originalRef.current = null;
    }
    elapsed.current = 0;
    if (!modelNodeName) return;

    const glbName = resolveGlbName(modelNodeName);

    scene.traverse((child) => {
      if (meshRef.current) return;
      if (!(child instanceof THREE.Mesh)) return;
      if (child.name !== glbName) return;

      meshRef.current = child;
      const src = Array.isArray(child.material)
        ? (child.material as THREE.Material[])[0]
        : (child.material as THREE.Material);
      originalRef.current = src;
      const cloned = src.clone() as THREE.MeshStandardMaterial;
      // Cambiar color base a naranja para que sea visualmente obvio
      cloned.color.set(PULSE_COLOR);
      cloned.emissive.set(PULSE_COLOR);
      cloned.emissiveIntensity = 0.4;
      clonedRef.current = cloned;
      child.material = cloned;
    });

    return () => {
      if (meshRef.current && originalRef.current) {
        meshRef.current.material = originalRef.current;
        clonedRef.current?.dispose();
        clonedRef.current = null;
        meshRef.current = null;
        originalRef.current = null;
      }
    };
  }, [modelNodeName, scene]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    elapsed.current += delta;
    const pulse = (Math.sin(elapsed.current * 2.8) + 1) / 2;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    if (mat.emissive) {
      mat.emissiveIntensity = 0.3 + pulse * 0.7;
    }
  });
}

// ── Beacon 3D sobre el edificio ────────────────────────────────────────────────

function DestinationBeacon({
  x, z, name,
}: {
  x: number; z: number; name: string;
}) {
  const pillarRef = useRef<THREE.Mesh>(null);
  const ringRef   = useRef<THREE.Mesh>(null);
  const elapsed   = useRef(0);

  useFrame((_, delta) => {
    elapsed.current += delta;
    const t = (Math.sin(elapsed.current * 3) + 1) / 2;

    if (pillarRef.current) {
      const mat = pillarRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.4 + t * 0.5;
    }
    if (ringRef.current) {
      const scale = 1 + t * 0.35;
      ringRef.current.scale.set(scale, scale, scale);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.55 - t * 0.3;
    }
  });

  const pillarY = BEACON_HEIGHT / 2;
  const coneY   = BEACON_HEIGHT + 3.5;
  const ringY   = 0.3;

  return (
    <group position={[x, 0, z]}>
      {/* Pillar */}
      <mesh ref={pillarRef} position={[0, pillarY, 0]}>
        <cylinderGeometry args={[0.35, 0.35, BEACON_HEIGHT, 8]} />
        <meshStandardMaterial
          color="#f97316"
          emissive="#f97316"
          emissiveIntensity={0.6}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* Cone (flecha apuntando hacia abajo) */}
      <mesh position={[0, coneY, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[2.2, 4.5, 8]} />
        <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.8} />
      </mesh>

      {/* Ring pulsante en el suelo */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, ringY, 0]}>
        <ringGeometry args={[5, 7.5, 32]} />
        <meshBasicMaterial color="#f97316" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>

      {/* Label flotante */}
      <Html position={[0, coneY + 6, 0]} center distanceFactor={90} occlude zIndexRange={[35, 0]}>
        <div
          style={{
            background: "#f97316",
            color: "#fff",
            padding: "5px 12px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 800,
            whiteSpace: "nowrap",
            boxShadow: "0 6px 16px rgba(0,0,0,0.28)",
            fontFamily: "Inter, sans-serif",
            letterSpacing: "0.01em",
            pointerEvents: "none",
          }}
        >
          📍 {name}
        </div>
      </Html>
    </group>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

export function DestinationBuildingHighlight() {
  const routeDestination = useBuildingStore((s) => s.routeDestination);
  const { scene } = useGLTF(MODEL_PATH);

  useBuildingGlow(routeDestination?.model_node_name, scene as unknown as THREE.Group);

  if (!routeDestination || routeDestination.x == null || routeDestination.z == null) {
    return null;
  }

  return (
    <DestinationBeacon
      x={routeDestination.x}
      z={routeDestination.z}
      name={routeDestination.name}
    />
  );
}
