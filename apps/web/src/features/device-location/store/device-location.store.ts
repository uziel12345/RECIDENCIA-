import { create } from "zustand";
import type {
  CampusCalibrationResult,
  CampusMapPosition,
  DeviceGeoPosition,
  DeviceLocationPermission,
  DeviceLocationStatus,
  LocalMetricPosition,
  LocationFilterReason,
  LocationQuality,
} from "../types/device-location.types";

export type DeviceLocationStore = {
  status: DeviceLocationStatus;
  permission: DeviceLocationPermission;
  rawPosition: DeviceGeoPosition | null;
  filteredPosition: DeviceGeoPosition | null;
  localPosition: LocalMetricPosition | null;
  campusPosition: CampusMapPosition | null;
  accuracyQuality: LocationQuality | null;
  errorMessage: string | null;
  isTracking: boolean;
  lastUpdateAt: number | null;
  calibrationStatus: CampusCalibrationResult["status"];
  calibrationMessage: string;
  calibrationScale: number | null;
  calibrationRotationRadians: number | null;
  lastFilterReason: LocationFilterReason | null;
  estimatedSpeedMetersPerSecond: number | null;

  setStatus: (status: DeviceLocationStatus) => void;
  setPermission: (permission: DeviceLocationPermission) => void;
  setRawPosition: (position: DeviceGeoPosition | null) => void;
  setFilteredPosition: (position: DeviceGeoPosition | null) => void;
  setLocalPosition: (position: LocalMetricPosition | null) => void;
  setCampusPosition: (position: CampusMapPosition | null) => void;
  setAccuracyQuality: (quality: LocationQuality | null) => void;
  setErrorMessage: (message: string | null) => void;
  setIsTracking: (isTracking: boolean) => void;
  setCalibrationResult: (result: CampusCalibrationResult) => void;
  setFilterMetadata: (
    reason: LocationFilterReason | null,
    speedMetersPerSecond: number | null,
  ) => void;
  resetLocation: () => void;
};

const INITIAL_STATE = {
  status: "idle" as const,
  permission: "unknown" as const,
  rawPosition: null,
  filteredPosition: null,
  localPosition: null,
  campusPosition: null,
  accuracyQuality: null,
  errorMessage: null,
  isTracking: false,
  lastUpdateAt: null,
  calibrationStatus: "pending" as const,
  calibrationMessage: "La calibración aún no está configurada.",
  calibrationScale: null,
  calibrationRotationRadians: null,
  lastFilterReason: null,
  estimatedSpeedMetersPerSecond: null,
};

export const useDeviceLocationStore = create<DeviceLocationStore>((set) => ({
  ...INITIAL_STATE,
  setStatus: (status) => set({ status }),
  setPermission: (permission) => set({ permission }),
  setRawPosition: (rawPosition) =>
    set({ rawPosition, lastUpdateAt: rawPosition ? Date.now() : null }),
  setFilteredPosition: (filteredPosition) => set({ filteredPosition }),
  setLocalPosition: (localPosition) => set({ localPosition }),
  setCampusPosition: (campusPosition) => set({ campusPosition }),
  setAccuracyQuality: (accuracyQuality) => set({ accuracyQuality }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  setIsTracking: (isTracking) => set({ isTracking }),
  setCalibrationResult: (result) =>
    set({
      calibrationStatus: result.status,
      calibrationMessage: result.message,
      calibrationScale:
        result.transform?.scaleModelUnitsPerMeter ?? null,
      calibrationRotationRadians:
        result.transform?.rotationRadians ?? null,
    }),
  setFilterMetadata: (lastFilterReason, estimatedSpeedMetersPerSecond) =>
    set({ lastFilterReason, estimatedSpeedMetersPerSecond }),
  resetLocation: () => set(INITIAL_STATE),
}));
