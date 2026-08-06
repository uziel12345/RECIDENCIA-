// Única fuente de verdad para la orientación del GLB. La calibración GPS
// documenta que Z local crece hacia el sur; por tanto, el norte es -Z antes
// de aplicar la rotación del grupo del campus.
export const MAP_ORIENTATION = {
  modelRotationYRadians: Math.PI / 2,
  geographicNorthLocal: { x: 0, z: -1 },
} as const;

export const CAMPUS_MODEL_ROTATION_Y = MAP_ORIENTATION.modelRotationYRadians;

export function getGeographicNorthWorld(): { x: number; z: number } {
  const { x, z } = MAP_ORIENTATION.geographicNorthLocal;
  const rotation = MAP_ORIENTATION.modelRotationYRadians;
  return {
    x: x * Math.cos(rotation) + z * Math.sin(rotation),
    z: -x * Math.sin(rotation) + z * Math.cos(rotation),
  };
}
