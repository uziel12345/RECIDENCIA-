import { getGeographicNorthWorld } from "./map-orientation.config";

export function getCompassRotationDegrees(
  forward: { x: number; z: number },
  north = getGeographicNorthWorld()
): number {
  const forwardLength = Math.hypot(forward.x, forward.z);
  const northLength = Math.hypot(north.x, north.z);
  if (forwardLength < 0.0001 || northLength < 0.0001) return 0;
  const fx = forward.x / forwardLength;
  const fz = forward.z / forwardLength;
  const nx = north.x / northLength;
  const nz = north.z / northLength;
  const cross = nx * fz - nz * fx;
  const dot = nx * fx + nz * fz;
  return -(Math.atan2(cross, dot) * 180) / Math.PI;
}
