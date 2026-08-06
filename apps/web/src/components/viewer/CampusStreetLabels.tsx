import { useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import type { CampusStreet } from "@ito-map/shared";
import { Icon } from "../ui/Icons";
import { getVisibleCampusStreets } from "./street-label-visibility";

const CAMERA_RECHECK_DISTANCE_SQ = 100;

export function StreetLabelCameraSync({
  onPositionChange,
}: {
  onPositionChange: (position: { x: number; z: number }) => void;
}) {
  const { camera } = useThree();
  const lastReported = useRef<{ x: number; z: number } | null>(null);

  useFrame(() => {
    const last = lastReported.current;
    const dx = camera.position.x - (last?.x ?? Number.POSITIVE_INFINITY);
    const dz = camera.position.z - (last?.z ?? Number.POSITIVE_INFINITY);
    if (last && dx * dx + dz * dz < CAMERA_RECHECK_DISTANCE_SQ) return;
    lastReported.current = { x: camera.position.x, z: camera.position.z };
    onPositionChange(lastReported.current);
  });
  return null;
}

export function CampusStreetLabels({
  streets,
  isMobile = false,
  hidden = false,
  cameraPosition,
}: {
  streets: CampusStreet[];
  isMobile?: boolean;
  hidden?: boolean;
  cameraPosition?: { x: number; z: number };
}) {
  if (hidden) return null;
  return (
    <>
      {getVisibleCampusStreets(streets, isMobile, cameraPosition).map((street) => (
        <Html
          key={street.id}
          position={[street.position.x, street.position.y, street.position.z]}
          center
          distanceFactor={isMobile ? 95 : 82}
          zIndexRange={[4, 0]}
          occlude={false}
        >
          <div className="ito-street-label" title={street.description ?? street.name}>
            <Icon name="route" size={12} aria-hidden="true" />
            {street.name}
          </div>
        </Html>
      ))}
    </>
  );
}
