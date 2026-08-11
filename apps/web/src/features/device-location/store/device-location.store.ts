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
import { angleDifferenceDegrees, getLocationQuality } from "../utils/location-math";

export type DeviceLocationStore = {
  status: DeviceLocationStatus;
  permission: DeviceLocationPermission;
  rawPosition: DeviceGeoPosition | null;
  filteredPosition: DeviceGeoPosition | null;
  /**
   * Última posición GPS aceptada como confiable (ver
   * position-stability.service.ts) — nunca se borra por una lectura mala ni
   * salta por el ruido normal del GPS estando parado. `localPosition` y
   * `campusPosition` (lo que realmente ve el usuario: marcador, cámara,
   * edificio actual) se derivan de ESTA posición, no de `filteredPosition`
   * directamente.
   */
  confirmedPosition: DeviceGeoPosition | null;
  /** Calidad de `confirmedPosition.accuracy` — para mensajes de "ubicación
   *  aproximada"; `null` mientras no exista ninguna posición confirmada. */
  confirmedAccuracyQuality: LocationQuality | null;
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
  /** Rumbo instantáneo (sin suavizar) del último tramo GPS aceptado. */
  movementHeadingDegrees: number | null;
  /**
   * Rumbo real de desplazamiento del usuario, suavizado — independiente de
   * la rotación de la cámara/mapa. `null` hasta que exista desplazamiento
   * suficiente (ver heading-tracker.service.ts); a partir de ahí conserva el
   * último valor válido en vez de volver a `null`, así sirve como último
   * rumbo conocido cuando el usuario se detiene.
   */
  smoothedHeadingDegrees: number | null;

  setStatus: (status: DeviceLocationStatus) => void;
  setPermission: (permission: DeviceLocationPermission) => void;
  setRawPosition: (position: DeviceGeoPosition | null) => void;
  setFilteredPosition: (position: DeviceGeoPosition | null) => void;
  setConfirmedPosition: (position: DeviceGeoPosition) => void;
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
  setMovementHeadingDegrees: (heading: number | null) => void;
  setSmoothedHeadingDegrees: (heading: number | null) => void;
  resetLocation: () => void;
};

const INITIAL_STATE = {
  status: "idle" as const,
  permission: "unknown" as const,
  rawPosition: null,
  filteredPosition: null,
  confirmedPosition: null,
  confirmedAccuracyQuality: null,
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
  movementHeadingDegrees: null,
  smoothedHeadingDegrees: null,
};

export const useDeviceLocationStore = create<DeviceLocationStore>((set) => ({
  ...INITIAL_STATE,
  setStatus: (status) => set({ status }),
  setPermission: (permission) => set({ permission }),
  setRawPosition: (rawPosition) =>
    set({ rawPosition, lastUpdateAt: rawPosition ? Date.now() : null }),
  setFilteredPosition: (filteredPosition) => set({ filteredPosition }),
  setConfirmedPosition: (confirmedPosition) =>
    set({
      confirmedPosition,
      confirmedAccuracyQuality: getLocationQuality(confirmedPosition.accuracy),
    }),
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
  setMovementHeadingDegrees: (movementHeadingDegrees) =>
    set({ movementHeadingDegrees }),
  // Guarda de ruido: en cada tick de GPS el rumbo suavizado cambia una
  // fracción de grado aunque el usuario esté prácticamente detenido. Sin
  // esto, cada lectura dispara un re-render de todo lo que lee este campo
  // (la guía de destino, la brújula) por una diferencia imperceptible.
  setSmoothedHeadingDegrees: (smoothedHeadingDegrees) =>
    set((state) => {
      if (
        state.smoothedHeadingDegrees !== null &&
        smoothedHeadingDegrees !== null &&
        Math.abs(
          angleDifferenceDegrees(
            smoothedHeadingDegrees,
            state.smoothedHeadingDegrees,
          ),
        ) < 0.05
      ) {
        return state;
      }
      return { smoothedHeadingDegrees };
    }),
  resetLocation: () => set(INITIAL_STATE),
}));
