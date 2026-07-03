import { create } from "zustand";

export type GeoCoordinates = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

export type MapCoordinates = {
  x: number;
  y: number;
  z: number;
};

export type NearestBuilding = {
  buildingId: string;
  buildingCode: string;
  buildingName: string;
  distanceMeters: number;
  confidence?: "high" | "medium" | "low";
  method?: "geofence" | "gps_and_model" | "gps_only" | "model_only" | "manual";
};

export type SimulatedPosition = {
  buildingId: string;
  buildingName: string;
  x: number;
  z: number;
};

type LocationPermissionState = "idle" | "granted" | "denied" | "unsupported";

const COORD_EPSILON = 0.000001;
const MAP_EPSILON = 0.05;

function sameNumber(a: number | null, b: number | null, epsilon: number): boolean {
  if (a === null || b === null) return a === b;
  return Math.abs(a - b) <= epsilon;
}

function sameGeoPosition(a: GeoCoordinates | null, b: GeoCoordinates | null): boolean {
  if (a === null || b === null) return a === b;
  return (
    sameNumber(a.latitude, b.latitude, COORD_EPSILON) &&
    sameNumber(a.longitude, b.longitude, COORD_EPSILON) &&
    sameNumber(a.accuracy, b.accuracy, 0.5)
  );
}

function sameMapPosition(a: MapCoordinates | null, b: MapCoordinates | null): boolean {
  if (a === null || b === null) return a === b;
  return (
    Math.abs(a.x - b.x) <= MAP_EPSILON &&
    Math.abs(a.y - b.y) <= MAP_EPSILON &&
    Math.abs(a.z - b.z) <= MAP_EPSILON
  );
}

function sameNearestBuilding(a: NearestBuilding | null, b: NearestBuilding | null): boolean {
  if (a === null || b === null) return a === b;
  return (
    a.buildingId === b.buildingId &&
    a.confidence === b.confidence &&
    a.method === b.method &&
    Math.abs(a.distanceMeters - b.distanceMeters) <= 1
  );
}

function sameSimulatedPosition(a: SimulatedPosition | null, b: SimulatedPosition | null): boolean {
  if (a === null || b === null) return a === b;
  return (
    a.buildingId === b.buildingId &&
    a.buildingName === b.buildingName &&
    Math.abs(a.x - b.x) <= MAP_EPSILON &&
    Math.abs(a.z - b.z) <= MAP_EPSILON
  );
}

type LocationStore = {
  permission: LocationPermissionState;
  geoPosition: GeoCoordinates | null;
  mapPosition: MapCoordinates | null;
  nearestBuilding: NearestBuilding | null;
  errorMessage: string | null;
  watchId: number | null;
  simulatedPosition: SimulatedPosition | null;

  setPermission: (permission: LocationPermissionState) => void;
  setGeoPosition: (position: GeoCoordinates | null) => void;
  setMapPosition: (position: MapCoordinates | null) => void;
  setNearestBuilding: (building: NearestBuilding | null) => void;
  setErrorMessage: (message: string | null) => void;
  setWatchId: (watchId: number | null) => void;
  setSimulatedPosition: (position: SimulatedPosition | null) => void;
  resetLocation: () => void;
};

export const useLocationStore = create<LocationStore>((set) => ({
  permission: "idle",
  geoPosition: null,
  mapPosition: null,
  nearestBuilding: null,
  errorMessage: null,
  watchId: null,
  simulatedPosition: null,

  setPermission: (permission) =>
    set((state) => (state.permission === permission ? state : { permission })),
  setGeoPosition: (geoPosition) =>
    set((state) =>
      sameGeoPosition(state.geoPosition, geoPosition) ? state : { geoPosition }
    ),
  setMapPosition: (mapPosition) =>
    set((state) =>
      sameMapPosition(state.mapPosition, mapPosition) ? state : { mapPosition }
    ),
  setNearestBuilding: (nearestBuilding) =>
    set((state) =>
      sameNearestBuilding(state.nearestBuilding, nearestBuilding)
        ? state
        : { nearestBuilding }
    ),
  setErrorMessage: (errorMessage) =>
    set((state) => (state.errorMessage === errorMessage ? state : { errorMessage })),
  setWatchId: (watchId) =>
    set((state) => (state.watchId === watchId ? state : { watchId })),
  setSimulatedPosition: (simulatedPosition) =>
    set((state) =>
      sameSimulatedPosition(state.simulatedPosition, simulatedPosition)
        ? state
        : { simulatedPosition }
    ),

  resetLocation: () =>
    set({
      permission: "idle",
      geoPosition: null,
      mapPosition: null,
      nearestBuilding: null,
      errorMessage: null,
      watchId: null,
      simulatedPosition: null,
    }),
}));
