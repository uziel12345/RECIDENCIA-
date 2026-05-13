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

export type ManualCalibration = {
  buildingId: string;
  buildingName: string;
  targetX: number;
  targetZ: number;
};

type LocationStore = {
  permission: LocationPermissionState;
  geoPosition: GeoCoordinates | null;
  mapPosition: MapCoordinates | null;
  isLowAccuracy: boolean;
  errorMessage: string | null;
  watchId: number | null;
  manualCalibration: ManualCalibration | null;

  setPermission: (permission: LocationPermissionState) => void;
  setGeoPosition: (position: GeoCoordinates | null) => void;
  setMapPosition: (position: MapCoordinates | null) => void;
  setIsLowAccuracy: (value: boolean) => void;
  setErrorMessage: (message: string | null) => void;
  setWatchId: (watchId: number | null) => void;
  setManualCalibration: (calibration: ManualCalibration | null) => void;
  resetLocation: () => void;
};

export const useLocationStore = create<LocationStore>((set) => ({
  permission: "idle",
  geoPosition: null,
  mapPosition: null,
  isLowAccuracy: false,
  errorMessage: null,
  watchId: null,
  manualCalibration: null,

  setPermission: (permission) => set({ permission }),
  setGeoPosition: (geoPosition) => set({ geoPosition }),
  setMapPosition: (mapPosition) => set({ mapPosition }),
  setIsLowAccuracy: (isLowAccuracy) => set({ isLowAccuracy }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  setWatchId: (watchId) => set({ watchId }),
  setManualCalibration: (manualCalibration) => set({ manualCalibration }),

  resetLocation: () =>
    set({
      permission: "idle",
      geoPosition: null,
      mapPosition: null,
      isLowAccuracy: false,
      errorMessage: null,
      watchId: null,
      manualCalibration: null,
    }),
}));