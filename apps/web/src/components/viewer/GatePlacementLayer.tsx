import { useRef } from "react";
import { Html } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

export type GatePlacementPosition = {
  x: number;
  z: number;
};

type GatePlacementLayerProps = {
  position: GatePlacementPosition | null;
  onPositionChange: (position: GatePlacementPosition) => void;
};

const PLANE_SIZE = 520;
const PLANE_Y = 3.05;
const MAX_CLICK_MOVEMENT_PX = 5;

export function GatePlacementLayer({
  position,
  onPositionChange,
}: GatePlacementLayerProps) {
  const planeRef = useRef<THREE.Mesh>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
  }

  function handlePointerUp(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    if (!start || !planeRef.current) return;

    const movement = Math.hypot(
      event.clientX - start.x,
      event.clientY - start.y,
    );
    if (movement > MAX_CLICK_MOVEMENT_PX) return;

    const localPoint =
      planeRef.current.parent?.worldToLocal(event.point.clone()) ?? event.point.clone();

    onPositionChange({
      x: Number(localPoint.x.toFixed(4)),
      z: Number(localPoint.z.toFixed(4)),
    });
  }

  return (
    <>
      <mesh
        ref={planeRef}
        position={[0, PLANE_Y, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <planeGeometry args={[PLANE_SIZE, PLANE_SIZE]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {position && (
        <group position={[position.x, PLANE_Y + 0.15, position.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.5, 4.2, 32]} />
            <meshBasicMaterial
              color="#f97316"
              transparent
              opacity={0.85}
              side={THREE.DoubleSide}
              depthTest={false}
            />
          </mesh>
          <mesh position={[0, 4.5, 0]}>
            <cylinderGeometry args={[0.28, 0.28, 9, 10]} />
            <meshBasicMaterial color="#f97316" depthTest={false} />
          </mesh>
          <mesh position={[0, 9.2, 0]}>
            <sphereGeometry args={[1.5, 18, 18]} />
            <meshBasicMaterial color="#fb923c" depthTest={false} />
          </mesh>
          <Html position={[0, 13, 0]} center distanceFactor={85} zIndexRange={[30, 20]}>
            <div className="whitespace-nowrap rounded-full border border-orange-300/40 bg-[#c2410c] px-3 py-1.5 text-xs font-bold text-white shadow-xl">
              X {position.x.toFixed(2)} · Z {position.z.toFixed(2)}
            </div>
          </Html>
        </group>
      )}
    </>
  );
}
