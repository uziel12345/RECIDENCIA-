import type { MapCoordinates } from "../../../store/location-store";

type GeoPoint = {
  latitude: number;
  longitude: number;
};

type CampusReference = {
  geo: GeoPoint;
  map: { x: number; z: number };
};

// Punto 1 real del campus y su equivalente en el modelo
const referenceA: CampusReference = {
  geo: {
    latitude: 17.073900,
    longitude: -96.726300,
  },
  map: {
    x: 10,
    z: -20,
  },
};

// Punto 2 real del campus y su equivalente en el modelo
const referenceB: CampusReference = {
  geo: {
    latitude: 17.074700,
    longitude: -96.725100,
  },
  map: {
    x: 90,
    z: 70,
  },
};

export function mapGeoToCampusCoordinates(
  latitude: number,
  longitude: number
): MapCoordinates {
  const latSpan = referenceB.geo.latitude - referenceA.geo.latitude;
  const lngSpan = referenceB.geo.longitude - referenceA.geo.longitude;

  const mapXSpan = referenceB.map.x - referenceA.map.x;
  const mapZSpan = referenceB.map.z - referenceA.map.z;

  const latRatio = (latitude - referenceA.geo.latitude) / latSpan;
  const lngRatio = (longitude - referenceA.geo.longitude) / lngSpan;

  const x = referenceA.map.x + lngRatio * mapXSpan;
  const z = referenceA.map.z + latRatio * mapZSpan;

  return {
    x,
    y: 2,
    z,
  };
}