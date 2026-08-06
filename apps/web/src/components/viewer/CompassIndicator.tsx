import { memo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { getCompassRotationDegrees } from "./compass-orientation";

export function CompassCameraSync({
  onRotationChange,
}: {
  onRotationChange: (degrees: number) => void;
}) {
  const { camera } = useThree();
  const direction = useRef(new Vector3());
  const previous = useRef(Number.NaN);

  useFrame(() => {
    camera.getWorldDirection(direction.current);
    const next = getCompassRotationDegrees(direction.current);
    if (!Number.isFinite(previous.current) || Math.abs(next - previous.current) >= 0.5) {
      previous.current = next;
      onRotationChange(next);
    }
  });
  return null;
}

export const CompassIndicator = memo(function CompassIndicator({
  rotationDegrees,
  isMobile = false,
}: {
  rotationDegrees: number;
  isMobile?: boolean;
}) {
  return (
    <div
      className={`ito-compass${isMobile ? " ito-compass--mobile" : ""}`}
      aria-label="Brújula del mapa: norte, sur, este y oeste"
      role="img"
    >
      <div
        className="ito-compass__rose"
        style={{ transform: `rotate(${rotationDegrees}deg)` }}
      >
        <span className="ito-compass__direction ito-compass__direction--north">N</span>
        <span className="ito-compass__direction ito-compass__direction--east">E</span>
        <span className="ito-compass__direction ito-compass__direction--south">S</span>
        <span className="ito-compass__direction ito-compass__direction--west">O</span>
        <span className="ito-compass__needle" aria-hidden="true" />
      </div>
    </div>
  );
});
