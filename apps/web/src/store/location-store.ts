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
};

export type SimulatedPosition = {
  buildingId: string;
  buildingName: string;
  x: number;
  z: number;
};

type LocationPermissionState = "idle" | "granted" | "denied" | "unsupported";

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

  setPermission: (permission) => set({ permission }),
  setGeoPosition: (geoPosition) => set({ geoPosition }),
  setMapPosition: (mapPosition) => set({ mapPosition }),
  setNearestBuilding: (nearestBuilding) => set({ nearestBuilding }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  setWatchId: (watchId) => set({ watchId }),
  setSimulatedPosition: (simulatedPosition) => set({ simulatedPosition }),

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
