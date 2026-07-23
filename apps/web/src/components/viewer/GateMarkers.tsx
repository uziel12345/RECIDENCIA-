import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { Gate } from "@ito-map/shared";
import { useGates } from "../../hooks/useGates";
import { useBuildingStore } from "../../store/building-store";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useDragAwareClick } from "./useDragAwareClick";

const GATE_COLOR = "#0d9488";
const MARKER_Y = 10;

const INVALIDATE_FPS_DESKTOP = 24;

function GateMarker({ gate, isSelected }: { gate: Gate; isSelected: boolean }) {
  const setSelectedGate = useBuildingStore((s) => s.setSelectedGate);
  const ringRef = useRef<THREE.Mesh>(null);
  const elapsed = useRef(0);
  const invalidate = useThree((state) => state.invalidate);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isSelected || isMobile) return;
    const fps = INVALIDATE_FPS_DESKTOP;
    const id = setInterval(() => invalidate(), 1000 / fps);
    return () => clearInterval(id);
  }, [isSelected, isMobile, invalidate]);

  useFrame((_, delta) => {
    if (isMobile || !isSelected || !ringRef.current) return;
    elapsed.current += delta;
    const t = (Math.sin(elapsed.current * 2.5) + 1) / 2;
    const scale = 1 + t * 0.3;
    ringRef.current.scale.set(scale, scale, scale);
    (ringRef.current.material as THREE.MeshBasicMaterial).opacity = isSelected
      ? 0.5 - t * 0.2
      : 0.25;
  });

  const { handlePointerDown, handleClick } = useDragAwareClick((event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    setSelectedGate(gate);
  });

  return (
    <group
      position={[gate.x, 0, gate.z]}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
        <ringGeometry args={[2.5, isSelected ? 4.5 : 3.5, 24]} />
        <meshBasicMaterial
          color={GATE_COLOR}
          transparent
          opacity={isSelected ? 0.35 : 0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {isSelected && (
        <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.25, 0]}>
          <ringGeometry args={[4.5, 6.5, 24]} />
          <meshBasicMaterial color={GATE_COLOR} transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
      )}

      <mesh position={[0, MARKER_Y / 2, 0]}>
        <cylinderGeometry args={[0.18, 0.18, MARKER_Y, 6]} />
        <meshStandardMaterial
          color={GATE_COLOR}
          emissive={GATE_COLOR}
          emissiveIntensity={isSelected ? 0.6 : 0.3}
          transparent
          opacity={isSelected ? 0.85 : 0.55}
        />
      </mesh>

      <mesh position={[0, MARKER_Y, 0]}>
        <sphereGeometry args={[isSelected ? 1.6 : 1.1, 16, 16]} />
        <meshStandardMaterial
          color={GATE_COLOR}
          emissive={GATE_COLOR}
          emissiveIntensity={isSelected ? 0.8 : 0.4}
        />
      </mesh>

      <Html
        position={[0, MARKER_Y + (isSelected ? 5 : 3.5), 0]}
        center
        distanceFactor={isMobile ? 105 : 90}
        occlude
        zIndexRange={[8, 0]}
      >
          <div
            style={{
              background: isSelected ? GATE_COLOR : "rgba(15, 23, 42, 0.92)",
              color: "#fff",
              padding: isSelected ? "6px 12px" : "4px 9px",
              borderRadius: 999,
              border: isSelected
                ? "1px solid rgba(255,255,255,0.35)"
                : "1px solid rgba(45,212,191,0.5)",
              fontSize: isSelected ? 12 : 11,
              fontWeight: 800,
              whiteSpace: "nowrap",
              boxShadow: "0 6px 16px rgba(0,0,0,0.28)",
              fontFamily: "Inter, sans-serif",
              pointerEvents: "none",
            }}
          >
            🚧 {gate.name}
          </div>
      </Html>
    </group>
  );
}

export function GateMarkers() {
  const { gates } = useGates();
  const selectedGate = useBuildingStore((s) => s.selectedGate);

  return (
    <>
      {gates
        .filter((gate) => gate.is_active)
        .map((gate) => (
          <GateMarker key={gate.id} gate={gate} isSelected={selectedGate?.id === gate.id} />
        ))}
    </>
  );
}
