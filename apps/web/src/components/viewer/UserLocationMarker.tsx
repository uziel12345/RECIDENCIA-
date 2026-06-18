import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useLocationStore } from "../../store/location-store";

const DOT_COLOR = "#2563eb";
const RING_SPEED = 1.4;
const RING_MAX_SCALE = 2.8;

export function UserLocationMarker() {
  const mapPosition = useLocationStore((s) => s.mapPosition);
  const nearestBuilding = useLocationStore((s) => s.nearestBuilding);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * RING_SPEED;

    if (ring1Ref.current) {
      const s = 1 + (t % 1) * (RING_MAX_SCALE - 1);
      ring1Ref.current.scale.setScalar(s);
      (ring1Ref.current.material as THREE.MeshBasicMaterial).opacity =
        1 - (t % 1) * 0.85;
    }

    if (ring2Ref.current) {
      const t2 = (t + 0.5) % 1;
      const s2 = 1 + t2 * (RING_MAX_SCALE - 1);
      ring2Ref.current.scale.setScalar(s2);
      (ring2Ref.current.material as THREE.MeshBasicMaterial).opacity =
        1 - t2 * 0.85;
    }
  });

  if (!mapPosition) return null;

  return (
    <group position={[mapPosition.x, mapPosition.y, mapPosition.z]}>
      {/* Pulsing rings on the ground */}
      <mesh ref={ring1Ref} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.2, 4.4, 32]} />
        <meshBasicMaterial
          color={DOT_COLOR}
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={ring2Ref} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.2, 4.4, 32]} />
        <meshBasicMaterial
          color={DOT_COLOR}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Base disc */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[1.4, 1.4, 0.35, 32]} />
        <meshStandardMaterial color="#1d4ed8" />
      </mesh>

      {/* Main sphere */}
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[1.6, 20, 20]} />
        <meshStandardMaterial
          color={DOT_COLOR}
          emissive={DOT_COLOR}
          emissiveIntensity={0.35}
        />
      </mesh>

      {/* Inner white dot */}
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.65, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Building label */}
      {nearestBuilding && (
        <Html
          position={[0, 7, 0]}
          center
          distanceFactor={60}
          zIndexRange={[5000, 0]}
        >
          <div className="ito-location-label">{nearestBuilding.buildingName}</div>
        </Html>
      )}
    </group>
  );
}
