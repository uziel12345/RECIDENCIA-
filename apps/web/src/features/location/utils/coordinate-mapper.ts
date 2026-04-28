// coordinate-mapper.ts

export type CampusPosition = {
  x: number;
  y: number;
  z: number;
};

/*
  🔴 Punto de referencia principal (Biblioteca)
*/
const REF_LAT = 17.07761201319465;
const REF_LNG = -96.74416660753468;

const REF_MODEL_X = 16.3803;
const REF_MODEL_Z = 12.3014;

/*
  🔧 Conversión grados → metros (zona Oaxaca)
*/
const METERS_PER_LAT = 111320;
const METERS_PER_LNG = 106411.66838807071;

/*
  🔥 MATRIZ DE TRANSFORMACIÓN (ya calibrada)
*/
const A_X = 0.943977879;
const B_X = 0.007413161;
const C_X = 9.63565497;

const A_Z = 0.0204740651;
const B_Z = -0.942769452;
const C_Z = 27.2371311;

/*
  🔥 OFFSET AJUSTADO (Centro de Cómputo)
*/
const OFFSET_X = 105.9078;
const OFFSET_Z = 33.0690;

/*
  🚀 FUNCIÓN PRINCIPAL
*/
export function mapGeoToCampusCoordinates(
  latitude: number,
  longitude: number
): CampusPosition {
  // Diferencia respecto al punto base
  const eastMeters = (longitude - REF_LNG) * METERS_PER_LNG;
  const northMeters = (latitude - REF_LAT) * METERS_PER_LAT;

  // Transformación
  const x = A_X * eastMeters + B_X * northMeters + C_X + OFFSET_X;
  const z = A_Z * eastMeters + B_Z * northMeters + C_Z + OFFSET_Z;

  // Debug
  console.log("====== GPS → MAPA 3D ======");
  console.log("GPS:", latitude, longitude);
  console.log("MAP:", x, z);

  return {
    x,
    y: 2,
    z,
  };
}