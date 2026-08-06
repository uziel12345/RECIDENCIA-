import { useCallback, useEffect, useRef } from "react";
import {
  CAMPUS_AXIS_INVERSION,
  CAMPUS_CALIBRATION_POINTS,
  CAMPUS_GEO_REFERENCE,
} from "../config/campus-location.config";
import {
  calculateCalibrationTransform,
  gpsToLocallyCorrectedCampusPosition,
} from "../services/campus-calibration.service";
import {
  checkDeviceLocationPermission,
  isDeviceGeolocationSupported,
  isDeviceLocationWatchActive,
  requestDeviceLocationPermission,
  startDeviceLocationWatch,
  stopDeviceLocationWatch,
  translateDeviceLocationError,
} from "../services/device-geolocation.service";
import { gpsToLocalMeters } from "../services/gps-to-local.service";
import { filterDeviceLocation } from "../services/location-filter.service";
import { useDeviceLocationStore } from "../store/device-location.store";
import type {
  DeviceGeoPosition,
  DeviceLocationPermission,
  GeoReferencePoint,
} from "../types/device-location.types";
import { getLocationQuality } from "../utils/location-math";

function getCalibration() {
  return calculateCalibrationTransform(
    CAMPUS_CALIBRATION_POINTS,
    CAMPUS_AXIS_INVERSION,
  );
}

function processDevicePosition(
  received: DeviceGeoPosition,
  sessionReference: { current: GeoReferencePoint | null },
) {
  const store = useDeviceLocationStore.getState();
  store.setStatus("tracking");
  store.setIsTracking(true);
  store.setRawPosition(received);
  store.setAccuracyQuality(getLocationQuality(received.accuracy));

  const calibration = getCalibration();
  store.setCalibrationResult(calibration);
  const filtered = filterDeviceLocation(received, store.filteredPosition);
  store.setFilterMetadata(
    filtered.reason,
    filtered.estimatedSpeedMetersPerSecond,
  );

  if (!filtered.accepted || !filtered.position) {
    if (filtered.reason === "invalid-reading") {
      store.setErrorMessage("El GPS entregó una lectura inválida.");
    }
    return;
  }

  store.setFilteredPosition(filtered.position);
  store.setErrorMessage(null);

  if (!sessionReference.current) {
    sessionReference.current = {
      latitude: filtered.position.latitude,
      longitude: filtered.position.longitude,
    };
  }
  const reference =
    calibration.transform?.reference ??
    CAMPUS_GEO_REFERENCE ??
    sessionReference.current;
  const localPosition = gpsToLocalMeters(filtered.position, reference);
  store.setLocalPosition(localPosition);
  store.setCampusPosition(
    localPosition && calibration.transform
      ? gpsToLocallyCorrectedCampusPosition(
          filtered.position,
          calibration.transform,
        )
      : null,
  );
}

async function ensurePermission(): Promise<DeviceLocationPermission> {
  const currentPermission = await checkDeviceLocationPermission();
  if (currentPermission === "granted" || currentPermission === "denied") {
    return currentPermission;
  }
  return requestDeviceLocationPermission();
}

export function useDeviceLocation() {
  const status = useDeviceLocationStore((state) => state.status);
  const permission = useDeviceLocationStore((state) => state.permission);
  const rawPosition = useDeviceLocationStore((state) => state.rawPosition);
  const filteredPosition = useDeviceLocationStore(
    (state) => state.filteredPosition,
  );
  const localPosition = useDeviceLocationStore((state) => state.localPosition);
  const campusPosition = useDeviceLocationStore(
    (state) => state.campusPosition,
  );
  const accuracyQuality = useDeviceLocationStore(
    (state) => state.accuracyQuality,
  );
  const errorMessage = useDeviceLocationStore((state) => state.errorMessage);
  const isTracking = useDeviceLocationStore((state) => state.isTracking);
  const lastUpdateAt = useDeviceLocationStore((state) => state.lastUpdateAt);
  const calibrationStatus = useDeviceLocationStore(
    (state) => state.calibrationStatus,
  );
  const calibrationMessage = useDeviceLocationStore(
    (state) => state.calibrationMessage,
  );
  const calibrationScale = useDeviceLocationStore(
    (state) => state.calibrationScale,
  );
  const calibrationRotationRadians = useDeviceLocationStore(
    (state) => state.calibrationRotationRadians,
  );
  const lastFilterReason = useDeviceLocationStore(
    (state) => state.lastFilterReason,
  );
  const estimatedSpeedMetersPerSecond = useDeviceLocationStore(
    (state) => state.estimatedSpeedMetersPerSecond,
  );
  const sessionReferenceRef = useRef<GeoReferencePoint | null>(null);
  const ownsWatchRef = useRef(false);
  const startInProgressRef = useRef(false);
  const lifecycleGenerationRef = useRef(0);

  const requestPermission = useCallback(async () => {
    const store = useDeviceLocationStore.getState();
    if (!isDeviceGeolocationSupported()) {
      store.setPermission("unknown");
      store.setStatus("unsupported");
      store.setErrorMessage(
        "Este dispositivo o navegador no soporta geolocalización.",
      );
      return "unknown" as const;
    }

    store.setStatus("requesting-permission");
    store.setErrorMessage(null);
    try {
      const nextPermission = await ensurePermission();
      store.setPermission(nextPermission);
      if (nextPermission === "granted") {
        store.setStatus("ready");
        return nextPermission;
      }
      store.setStatus("permission-denied");
      store.setErrorMessage(
        "El permiso de ubicación está bloqueado. Abre el candado o los ajustes del sitio, selecciona Ubicación: Permitir y vuelve a intentarlo.",
      );
      return nextPermission;
    } catch (error) {
      store.setStatus("error");
      store.setErrorMessage(translateDeviceLocationError(error));
      return "unknown" as const;
    }
  }, []);

  const stopTracking = useCallback(async () => {
    lifecycleGenerationRef.current += 1;
    await stopDeviceLocationWatch();
    ownsWatchRef.current = false;
    const store = useDeviceLocationStore.getState();
    store.setIsTracking(false);
    store.setStatus(store.permission === "granted" ? "ready" : "idle");
  }, []);

  const startTracking = useCallback(async () => {
    const store = useDeviceLocationStore.getState();
    if (startInProgressRef.current) return;
    if (isDeviceLocationWatchActive()) {
      store.setIsTracking(true);
      store.setStatus("tracking");
      return;
    }

    startInProgressRef.current = true;
    const generation = ++lifecycleGenerationRef.current;

    try {
      const nextPermission = await requestPermission();
      if (
        nextPermission !== "granted" ||
        generation !== lifecycleGenerationRef.current
      ) {
        return;
      }

      const started = await startDeviceLocationWatch(
        (position) => processDevicePosition(position, sessionReferenceRef),
        (message) => {
          const currentStore = useDeviceLocationStore.getState();
          currentStore.setStatus("error");
          currentStore.setErrorMessage(message);
        },
      );
      if (generation !== lifecycleGenerationRef.current) {
        await stopDeviceLocationWatch();
        return;
      }
      if (started) ownsWatchRef.current = true;
      store.setIsTracking(isDeviceLocationWatchActive());
      store.setStatus(isDeviceLocationWatchActive() ? "tracking" : "ready");
    } catch (error) {
      store.setIsTracking(false);
      store.setStatus("error");
      store.setErrorMessage(translateDeviceLocationError(error));
    } finally {
      startInProgressRef.current = false;
    }
  }, [requestPermission]);

  const resetLocation = useCallback(async () => {
    lifecycleGenerationRef.current += 1;
    await stopDeviceLocationWatch();
    ownsWatchRef.current = false;
    sessionReferenceRef.current = null;
    const store = useDeviceLocationStore.getState();
    store.resetLocation();
    store.setCalibrationResult(getCalibration());
  }, []);

  useEffect(() => {
    useDeviceLocationStore.getState().setCalibrationResult(getCalibration());
    return () => {
      lifecycleGenerationRef.current += 1;
      if (ownsWatchRef.current || startInProgressRef.current) {
        void stopDeviceLocationWatch();
      }
    };
  }, []);

  return {
    status,
    permission,
    rawPosition,
    filteredPosition,
    localPosition,
    campusPosition,
    accuracyQuality,
    errorMessage,
    isTracking,
    lastUpdateAt,
    calibrationStatus,
    calibrationMessage,
    calibrationScale,
    calibrationRotationRadians,
    lastFilterReason,
    estimatedSpeedMetersPerSecond,
    requestPermission,
    startTracking,
    stopTracking,
    resetLocation,
  };
}
