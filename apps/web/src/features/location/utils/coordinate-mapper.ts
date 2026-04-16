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

const EARTH_RADIUS = 6378137;

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

function latLngToLocalMeters(origin: GeoPoint, point: GeoPoint): { x: number; z: number } {
  const lat1 = degreesToRadians(origin.latitude);
  const lat2 = degreesToRadians(point.latitude);
  const dLat = lat2 - lat1;
  const dLng = degreesToRadians(point.longitude - origin.longitude);
  const meanLat = (lat1 + lat2) / 2;

  const x = EARTH_RADIUS * dLng * Math.cos(meanLat);
  const z = EARTH_RADIUS * dLat;

  return { x, z };
}

function magnitude(v: { x: number; z: number }): number {
  return Math.sqrt(v.x * v.x + v.z * v.z);
}

function rotate2D(point: { x: number; z: number }, angle: number): { x: number; z: number } {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return {
    x: point.x * cos - point.z * sin,
    z: point.x * sin + point.z * cos,
  };
}

function angleOf(v: { x: number; z: number }): number {
  return Math.atan2(v.z, v.x);
}

function buildTransform() {
  const geoA = { x: 0, z: 0 };
  const geoB = latLngToLocalMeters(referenceA.geo, referenceB.geo);

  const mapA = referenceA.map;
  const mapB = referenceB.map;

  const geoVector = {
    x: geoB.x - geoA.x,
    z: geoB.z - geoA.z,
  };

  const mapVector = {
    x: mapB.x - mapA.x,
    z: mapB.z - mapA.z,
  };

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

const transform = buildTransform();

/**
 * Convierte coordenadas GPS reales a coordenadas del modelo 3D.
 * El resultado se proyecta sobre el plano XZ del campus.
 */
export function mapGeoToCampusCoordinates(
  latitude: number,
  longitude: number,
  fixedY = 1.5
): CampusCoordinates {
  const localMeters = latLngToLocalMeters(referenceA.geo, {
    latitude,
    longitude,
  });

  const scaled = {
    x: localMeters.x * transform.scale,
    z: localMeters.z * transform.scale,
  };

  const rotated = rotate2D(scaled, transform.rotation);

  return {
    x: referenceA.map.x + rotated.x,
    y: fixedY,
    z: referenceA.map.z + rotated.z,
  };
}

/**
 * Útil para depuración.
 */
export function getCoordinateMapperDebugInfo() {
  return {
    referenceA,
    referenceB,
    scale: transform.scale,
    rotationRadians: transform.rotation,
    rotationDegrees: (transform.rotation * 180) / Math.PI,
  };
}