// coordinate-mapper.ts

export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export type MapPoint = {
  x: number;
  z: number;
};

export type CampusReference = {
  name: string;
  geo: GeoPoint;
  map: MapPoint;
};

export type CampusCoordinates = {
  x: number;
  y: number;
  z: number;
};

type Vector2 = {
  x: number;
  z: number;
};

type AffineTransform2D = {
  a: number;
  b: number;
  c: number;
  d: number;
  tx: number;
  tz: number;
};

const EARTH_RADIUS = 6378137;
const DEFAULT_MARKER_HEIGHT = 1.5;

const OFFSET_X = 0;
const OFFSET_Z = 0;

/**
 * Referencias reales del campus.
 * GPS tomados físicamente.
 * Coordenadas map tomadas del modelo 3D.
 */
const references: CampusReference[] = [
  {
    name: "Direccion",
    geo: {
      latitude: 17.077497209169888,
      longitude: -96.74510408714406,
    },
    map: {
      x: -86.2153,
      z: 38.0304,
    },
  },
  {
    name: "Biblioteca",
    geo: {
      latitude: 17.077629327716817,
      longitude: -96.74419648210583,
    },
    map: {
      x: 16.3803,
      z: 12.3014,
    },
  },
  {
    name: "Centro de Computo",
    geo: {
      latitude: 17.079046638376777,
      longitude: -96.74442423422452,
    },
    map: {
      x: 0.7661,
      z: -126.9385,
    },
  },
];

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function validateReferences(input: CampusReference[]): void {
  if (input.length < 3) {
    throw new Error("Se requieren al menos 3 referencias para calibración afín.");
  }

  input.forEach((ref, index) => {
    if (
      !Number.isFinite(ref.geo.latitude) ||
      !Number.isFinite(ref.geo.longitude)
    ) {
      throw new Error(`La referencia ${index + 1} tiene GPS inválido.`);
    }

    if (!Number.isFinite(ref.map.x) || !Number.isFinite(ref.map.z)) {
      throw new Error(`La referencia ${index + 1} tiene coordenadas de modelo inválidas.`);
    }
  });
}

/**
 * Convierte lat/lng a coordenadas locales planas en metros
 * usando como origen la primera referencia.
 *
 * x -> este/oeste
 * z -> norte/sur
 */
function latLngToLocalMeters(origin: GeoPoint, point: GeoPoint): Vector2 {
  const lat1 = degreesToRadians(origin.latitude);
  const lat2 = degreesToRadians(point.latitude);

  const deltaLat = lat2 - lat1;
  const deltaLng = degreesToRadians(point.longitude - origin.longitude);

  const meanLat = (lat1 + lat2) / 2;

  const x = EARTH_RADIUS * deltaLng * Math.cos(meanLat);
  const z = EARTH_RADIUS * deltaLat;

  return { x, z };
}

/**
 * Resuelve un sistema lineal 3x3 por eliminación gaussiana.
 */
function solve3x3(matrix: number[][], vector: number[]): [number, number, number] {
  const m = matrix.map((row, i) => [...row, vector[i]]);

  for (let col = 0; col < 3; col++) {
    let pivotRow = col;

    for (let row = col + 1; row < 3; row++) {
      if (Math.abs(m[row][col]) > Math.abs(m[pivotRow][col])) {
        pivotRow = row;
      }
    }

    if (Math.abs(m[pivotRow][col]) < 1e-12) {
      throw new Error(
        "No se pudo resolver la calibración. Las referencias pueden estar mal alineadas."
      );
    }

    if (pivotRow !== col) {
      [m[col], m[pivotRow]] = [m[pivotRow], m[col]];
    }

    const pivot = m[col][col];
    for (let j = col; j < 4; j++) {
      m[col][j] /= pivot;
    }

    for (let row = 0; row < 3; row++) {
      if (row === col) continue;

      const factor = m[row][col];
      for (let j = col; j < 4; j++) {
        m[row][j] -= factor * m[col][j];
      }
    }
  }

  return [m[0][3], m[1][3], m[2][3]];
}

/**
 * Construye una transformación afín 2D:
 *
 * mapX = a * geoX + b * geoZ + tx
 * mapZ = c * geoX + d * geoZ + tz
 */
function buildAffineTransform(input: CampusReference[]): AffineTransform2D {
  validateReferences(input);

  const origin = input[0].geo;

  const localPoints = input.map((ref) => ({
    name: ref.name,
    geo: latLngToLocalMeters(origin, ref.geo),
    map: ref.map,
  }));

  const [p1, p2, p3] = localPoints;

  const matrix = [
    [p1.geo.x, p1.geo.z, 1],
    [p2.geo.x, p2.geo.z, 1],
    [p3.geo.x, p3.geo.z, 1],
  ];

  const xVector = [p1.map.x, p2.map.x, p3.map.x];
  const zVector = [p1.map.z, p2.map.z, p3.map.z];

  const [a, b, tx] = solve3x3(matrix, xVector);
  const [c, d, tz] = solve3x3(matrix, zVector);

  return { a, b, c, d, tx, tz };
}

const transform = buildAffineTransform(references);

/**
 * Convierte un punto GPS real a coordenadas del modelo 3D.
 */
export function mapGeoToCampusCoordinates(
  latitude: number,
  longitude: number,
  fixedY = DEFAULT_MARKER_HEIGHT
): CampusCoordinates {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Latitude y longitude deben ser números válidos.");
  }

  const origin = references[0].geo;
  const local = latLngToLocalMeters(origin, { latitude, longitude });

  const x = transform.a * local.x + transform.b * local.z + transform.tx + OFFSET_X;
  const z = transform.c * local.x + transform.d * local.z + transform.tz + OFFSET_Z;

  return {
    x,
    y: fixedY,
    z,
  };
}

export function mapGeoToCampusDebug(
  latitude: number,
  longitude: number,
  fixedY = DEFAULT_MARKER_HEIGHT
) {
  const origin = references[0].geo;
  const local = latLngToLocalMeters(origin, { latitude, longitude });

  const x = transform.a * local.x + transform.b * local.z + transform.tx + OFFSET_X;
  const z = transform.c * local.x + transform.d * local.z + transform.tz + OFFSET_Z;

  return {
    input: {
      latitude,
      longitude,
    },
    localMeters: local,
    transform,
    offsets: {
      x: OFFSET_X,
      z: OFFSET_Z,
    },
    result: {
      x,
      y: fixedY,
      z,
    },
  };
}

export function getCoordinateMapperDebugInfo() {
  return {
    references,
    transform,
    offsets: {
      x: OFFSET_X,
      z: OFFSET_Z,
    },
  };
}