export type CampusPosition = {
  x: number;
  y: number;
  z: number;
};

const REF_LAT = 17.07761201319465;
const REF_LNG = -96.74416660753468;

const METERS_PER_LAT = 111320;
const METERS_PER_LNG = 106411.66838807071;

const A_X = 0.943977879;
const B_X = 0.007413161;
const C_X = 9.63565497;

const A_Z = 0.0204740651;
const B_Z = -0.942769452;
const C_Z = 27.2371311;

/*
  Ajuste manual fino.
  Primero déjalo en 0.
  Luego lo ajustamos viendo dónde cae el punto azul.
*/
const OFFSET_X = 0;
const OFFSET_Z = 0;

export function mapGeoToCampusCoordinates(
  latitude: number,
  longitude: number
): CampusPosition {
  const eastMeters = (longitude - REF_LNG) * METERS_PER_LNG;
  const northMeters = (latitude - REF_LAT) * METERS_PER_LAT;

  const x = A_X * eastMeters + B_X * northMeters + C_X + OFFSET_X;
  const z = A_Z * eastMeters + B_Z * northMeters + C_Z + OFFSET_Z;

  console.log("====== GPS → MAPA 3D ======");
  console.log("GPS:", latitude, longitude);
  console.log("MAP:", x, z);

  return {
    x,
    y: 2,
    z,
  };
}