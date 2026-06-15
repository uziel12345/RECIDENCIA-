import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Mesh, MeshBasicMaterial, RingGeometry } from "three";
import { useLocationStore } from "../../store/location-store";

export function UserLocationMarker() {
  const mapPosition = useLocationStore((state) => state.mapPosition);
  const isLowAccuracy = useLocationStore((state) => state.isLowAccuracy);
  const ring1Ref = useRef<Mesh<RingGeometry, MeshBasicMaterial>>(null);
  const ring2Ref = useRef<Mesh>(null);
  const elapsedRef = useRef(0);

  useFrame((_, delta) => {
    elapsedRef.current += delta;
    const elapsed = elapsedRef.current;
    const maxOpacity = isLowAccuracy ? 0.35 : 0.65;

    if (ring1Ref.current) {
      const t = (elapsed % 2.0) / 2.0;
      ring1Ref.current.scale.set(1 + t * 3.2, 1 + t * 3.2, 1);
      ring1Ref.current.material.opacity = (1 - t) * maxOpacity;
    }
    if (ring2Ref.current) {
      const t = ((elapsed + 1.0) % 2.0) / 2.0;
      ring2Ref.current.scale.set(1 + t * 3.2, 1 + t * 3.2, 1);
      (ring2Ref.current.material as MeshBasicMaterial).opacity = (1 - t) * maxOpacity * 0.65;
    }
  });

  if (!mapPosition) return null;

  const markerColor = isLowAccuracy ? "#94a3b8" : "#ea580c";
  const markerEmissive = isLowAccuracy ? "#64748b" : "#c2410c";

  return (
    <group position={[mapPosition.x, 0, mapPosition.z]}>
      {/* Radio de imprecisión */}
      {isLowAccuracy && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <circleGeometry args={[22, 64]} />
          <meshBasicMaterial color="#94a3b8" transparent opacity={0.08} />
        </mesh>
      )}

      {/* Disco de glow en el suelo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <circleGeometry args={[4.5, 48]} />
        <meshBasicMaterial
          color={markerColor}
          transparent
          opacity={isLowAccuracy ? 0.1 : 0.22}
        />
      </mesh>

      {/* Anillo expansivo 1 */}
      <mesh ref={ring1Ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.18, 0]}>
        <ringGeometry args={[3.8, 5, 48]} />
        <meshBasicMaterial color={markerColor} transparent opacity={0.65} />
      </mesh>

      {/* Anillo expansivo 2 — offset 1 s */}
      <mesh ref={ring2Ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.22, 0]}>
        <ringGeometry args={[3.8, 5, 48]} />
        <meshBasicMaterial color={markerColor} transparent opacity={0.45} />
      </mesh>

      {/* Polo que conecta suelo con la esfera */}
      <mesh position={[0, 4.6, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 9.2, 6]} />
        <meshStandardMaterial color={markerEmissive} emissive={markerEmissive} emissiveIntensity={0.45} />
      </mesh>

      {/* Esfera principal */}
      <mesh position={[0, 9.2, 0]}>
        <sphereGeometry args={[2.8, 32, 32]} />
        <meshStandardMaterial
          color={markerColor}
          emissive={markerEmissive}
          emissiveIntensity={isLowAccuracy ? 0.2 : 0.6}
        />
      </mesh>

      {/* Punto blanco interior */}
      <mesh position={[0, 9.2, 0]}>
        <sphereGeometry args={[1.1, 24, 24]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.35} />
      </mesh>

      {isLowAccuracy && (
        <Html position={[0, 14.5, 0]} center occlude zIndexRange={[30, 0]}>
          <div
            style={{
              padding: "5px 9px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.96)",
              border: "1px solid #cbd5e1",
              color: "#475569",
              fontSize: 11,
              fontWeight: 800,
              whiteSpace: "nowrap",
              boxShadow: "0 4px 10px rgba(15,23,42,0.16)",
            }}
          >
            Ubicación aproximada
          </div>
        </Html>
      )}
    </group>
  );
}
