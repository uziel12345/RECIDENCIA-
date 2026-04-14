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

type LocationPermissionState = "idle" | "granted" | "denied" | "unsupported";

type LocationStore = {
  permission: LocationPermissionState;
  geoPosition: GeoCoordinates | null;
  mapPosition: MapCoordinates | null;
  errorMessage: string | null;
  watchId: number | null;
  setPermission: (permission: LocationPermissionState) => void;
  setGeoPosition: (position: GeoCoordinates | null) => void;
  setMapPosition: (position: MapCoordinates | null) => void;
  setErrorMessage: (message: string | null) => void;
  setWatchId: (watchId: number | null) => void;
  resetLocation: () => void;
};

export const useLocationStore = create<LocationStore>((set) => ({
  permission: "idle",
  geoPosition: null,
  mapPosition: null,
  errorMessage: null,
  watchId: null,

  setPermission: (permission) => set({ permission }),
  setGeoPosition: (geoPosition) => set({ geoPosition }),
  setMapPosition: (mapPosition) => set({ mapPosition }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  setWatchId: (watchId) => set({ watchId }),

  resetLocation: () =>
    set({
      permission: "idle",
      geoPosition: null,
      mapPosition: null,
      errorMessage: null,
      watchId: null,
    }),
}));