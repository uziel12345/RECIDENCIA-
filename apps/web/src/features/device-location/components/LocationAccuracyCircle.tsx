import { useEffect, useMemo } from "react";
import {
  CircleGeometry,
  DoubleSide,
  MeshBasicMaterial,
} from "three";
import { ACCURACY_CIRCLE_HEIGHT } from "../config/campus-location.config";
import type { CampusMapPosition } from "../types/device-location.types";

type LocationAccuracyCircleProps = {
  position: CampusMapPosition;
  radiusModelUnits: number;
};

export function LocationAccuracyCircle({
  position,
  radiusModelUnits,
}: LocationAccuracyCircleProps) {
  const geometry = useMemo(() => new CircleGeometry(1, 64), []);
  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        color: "#38bdf8",
        transparent: true,
        opacity: 0.18,
        side: DoubleSide,
        depthWrite: false,
      }),
    [],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  if (!Number.isFinite(radiusModelUnits) || radiusModelUnits <= 0) return null;

  return (
    <mesh
      position={[position.x, ACCURACY_CIRCLE_HEIGHT, position.z]}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={[radiusModelUnits, radiusModelUnits, 1]}
      geometry={geometry}
      material={material}
      raycast={() => undefined}
      renderOrder={10}
    />
  );
}
