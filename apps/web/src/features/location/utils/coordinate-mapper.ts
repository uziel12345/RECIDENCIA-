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

type CoordinateTransform = {
  scale: number;
  rotation: number;
};

const EARTH_RADIUS = 6378137;
const DEFAULT_MARKER_HEIGHT = 1.5;

/**
 * IMPORTANTE
 * Estos valores son temporales de ejemplo.
 * Reemplázalos con tus dos puntos reales del campus:
 * 1. GPS real
 * 2. Coordenada del modelo 3D obtenida con Shift + click
 */
const referenceA: CampusReference = {
  geo: {
    latitude: 17.0736,
    longitude: -96.7262,
  },
  map: {
    x: 0,
    z: 0,
  },
};

const referenceB: CampusReference = {
  geo: {
    latitude: 17.0741,
    longitude: -96.7256,
  },
  map: {
    x: 120,
    z: -85,
  },
};

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function radiansToDegrees(value: number): number {
  return (value * 180) / Math.PI;
}

/**
 * Convierte lat/lng a coordenadas locales planas en metros
 * tomando como origen un punto de referencia.
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

function subtractVectors(a: Vector2, b: Vector2): Vector2 {
  return {
    x: a.x - b.x,
    z: a.z - b.z,
  };
}

function addVectors(a: Vector2, b: Vector2): Vector2 {
  return {
    x: a.x + b.x,
    z: a.z + b.z,
  };
}

function multiplyVector(vector: Vector2, scalar: number): Vector2 {
  return {
    x: vector.x * scalar,
    z: vector.z * scalar,
  };
}

function magnitude(vector: Vector2): number {
  return Math.sqrt(vector.x * vector.x + vector.z * vector.z);
}

function rotate2D(point: Vector2, angle: number): Vector2 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return {
    x: point.x * cos - point.z * sin,
    z: point.x * sin + point.z * cos,
  };
}

function angleOf(vector: Vector2): number {
  return Math.atan2(vector.z, vector.x);
}

function validateReference(reference: CampusReference, label: string): void {
  if (
    !Number.isFinite(reference.geo.latitude) ||
    !Number.isFinite(reference.geo.longitude)
  ) {
    throw new Error(`La referencia ${label} tiene coordenadas GPS inválidas.`);
  }

  if (!Number.isFinite(reference.map.x) || !Number.isFinite(reference.map.z)) {
    throw new Error(`La referencia ${label} tiene coordenadas del modelo inválidas.`);
  }
}

function buildTransform(refA: CampusReference, refB: CampusReference): CoordinateTransform {
  validateReference(refA, "A");
  validateReference(refB, "B");

  const geoA: Vector2 = { x: 0, z: 0 };
  const geoB = latLngToLocalMeters(refA.geo, refB.geo);

  const mapA: Vector2 = {
    x: refA.map.x,
    z: refA.map.z,
  };

  const mapB: Vector2 = {
    x: refB.map.x,
    z: refB.map.z,
  };

  const geoVector = subtractVectors(geoB, geoA);
  const mapVector = subtractVectors(mapB, mapA);

  const geoDistance = magnitude(geoVector);
  const mapDistance = magnitude(mapVector);

  if (geoDistance === 0) {
    throw new Error("Las referencias GPS no pueden ser iguales.");
  }

  if (mapDistance === 0) {
    throw new Error("Las referencias del modelo no pueden ser iguales.");
  }

  const scale = mapDistance / geoDistance;
  const rotation = angleOf(mapVector) - angleOf(geoVector);

  return {
    scale,
    rotation,
  };
}

const transform = buildTransform(referenceA, referenceB);

/**
 * Convierte un punto GPS real a coordenadas del modelo 3D.
 * El resultado se posiciona en el plano XZ del campus.
 */
export function mapGeoToCampusCoordinates(
  latitude: number,
  longitude: number,
  fixedY = DEFAULT_MARKER_HEIGHT
): CampusCoordinates {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Latitude y longitude deben ser números válidos.");
  }

  const localMeters = latLngToLocalMeters(referenceA.geo, {
    latitude,
    longitude,
  });

  const scaled = multiplyVector(localMeters, transform.scale);
  const rotated = rotate2D(scaled, transform.rotation);

  const translated = addVectors(
    {
      x: referenceA.map.x,
      z: referenceA.map.z,
    },
    rotated
  );

  return {
    x: translated.x,
    y: fixedY,
    z: translated.z,
  };
}

/**
 * Función auxiliar de depuración.
 * Convierte un punto GPS a su representación intermedia.
 */
export function mapGeoToCampusDebug(
  latitude: number,
  longitude: number,
  fixedY = DEFAULT_MARKER_HEIGHT
) {
  const localMeters = latLngToLocalMeters(referenceA.geo, {
    latitude,
    longitude,
  });

  const scaled = multiplyVector(localMeters, transform.scale);
  const rotated = rotate2D(scaled, transform.rotation);

  const result = {
    x: referenceA.map.x + rotated.x,
    y: fixedY,
    z: referenceA.map.z + rotated.z,
  };

  return {
    input: {
      latitude,
      longitude,
    },
    localMeters,
    scaled,
    rotated,
    result,
  };
}

/**
 * Útil para imprimir en consola y validar la calibración.
 */
export function getCoordinateMapperDebugInfo() {
  return {
    referenceA,
    referenceB,
    scale: transform.scale,
    rotationRadians: transform.rotation,
    rotationDegrees: radiansToDegrees(transform.rotation),
  };
}