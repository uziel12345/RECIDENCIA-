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
import {
  INITIAL_HEADING_TRACKER_STATE,
  updateHeadingTracker,
  type HeadingTrackerState,
} from "../services/heading-tracker.service";
import { filterDeviceLocation } from "../services/location-filter.service";
import { smoothGeoPosition } from "../services/location-smoothing.service";
import {
  INITIAL_POSITION_STABILITY_STATE,
  updatePositionStability,
  type PositionStabilityState,
} from "../services/position-stability.service";
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
  headingTracker: { current: HeadingTrackerState },
  positionStability: { current: PositionStabilityState },
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

  // El filtro de saltos ya descartó lecturas imposibles, pero una lectura
  // ruidosa que sigue dentro de límites razonables (el GPS oscila unos
  // metros estando quieto, típico cerca de edificios) se aceptaba tal cual
  // como la nueva posición — el marcador "perseguía" cada bandazo con una
  // animación suave en vez de quedarse quieto ("movimiento fantasma").
  // Suavizar aquí, ponderando por la precisión reportada, corrige eso en el
  // dato mismo, no solo en cómo se anima.
  const smoothed = smoothGeoPosition(filtered.position, store.filteredPosition);
  store.setFilteredPosition(smoothed);
  store.setErrorMessage(null);

  // Rumbo REAL de desplazamiento, derivado de posiciones GPS consecutivas —
  // nunca de la cámara/mapa 3D (ver destination-bearing.ts para esa otra
  // composición, deliberadamente separada). Solo se actualiza el store
  // cuando este tick sí calculó un rumbo nuevo; si no, se conserva el
  // último valor válido tal cual (heading-tracker.service.ts).
  const headingResult = updateHeadingTracker(smoothed, headingTracker.current);
  headingTracker.current = headingResult.state;
  if (headingResult.updated) {
    store.setMovementHeadingDegrees(headingResult.movementHeadingDegrees);
    store.setSmoothedHeadingDegrees(headingResult.smoothedHeadingDegrees);
  }

  // Posición CONFIRMADA: lo que realmente se muestra (marcador, cámara,
  // edificio actual) nunca se deriva de `smoothed` directamente — una sola
  // lectura con precisión mala haría que localPosition/campusPosition se
  // volvieran null o saltaran, aunque ya hubiera una posición confiable
  // conocida (la causa exacta de que "el marcador desaparezca"). En vez de
  // eso, se deriva de la última posición que superó el filtro de
  // estabilidad (position-stability.service.ts): se conserva tal cual ante
  // una lectura mala o un desplazamiento indistinguible del ruido del GPS.
  const stabilityResult = updatePositionStability(smoothed, positionStability.current);
  positionStability.current = stabilityResult.state;
  const confirmed = stabilityResult.confirmedPosition;

  if (!confirmed) {
    // Todavía no hay ninguna posición confiable esta sesión (arrancando con
    // precisión mala) — no hay nada que mostrar aún, pero tampoco nada que
    // "borrar": localPosition/campusPosition ya empiezan en null.
    return;
  }

  store.setConfirmedPosition(confirmed);

  if (!sessionReference.current) {
    sessionReference.current = {
      latitude: confirmed.latitude,
      longitude: confirmed.longitude,
    };
  }

  if (!stabilityResult.updated) {
    // La posición confirmada no cambió este tick: localPosition/campusPosition
    // ya reflejan este mismo punto, recalcularlos sería trabajo repetido y un
    // set() (con su re-render) por nada.
    return;
  }

  const reference =
    calibration.transform?.reference ??
    CAMPUS_GEO_REFERENCE ??
    sessionReference.current;
  const localPosition = gpsToLocalMeters(confirmed, reference);
  store.setLocalPosition(localPosition);
  store.setCampusPosition(
    localPosition && calibration.transform
      ? gpsToLocallyCorrectedCampusPosition(confirmed, calibration.transform)
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
  const confirmedPosition = useDeviceLocationStore(
    (state) => state.confirmedPosition,
  );
  const confirmedAccuracyQuality = useDeviceLocationStore(
    (state) => state.confirmedAccuracyQuality,
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
  const movementHeadingDegrees = useDeviceLocationStore(
    (state) => state.movementHeadingDegrees,
  );
  const smoothedHeadingDegrees = useDeviceLocationStore(
    (state) => state.smoothedHeadingDegrees,
  );
  const sessionReferenceRef = useRef<GeoReferencePoint | null>(null);
  const headingTrackerRef = useRef<HeadingTrackerState>(
    INITIAL_HEADING_TRACKER_STATE,
  );
  const positionStabilityRef = useRef<PositionStabilityState>(
    INITIAL_POSITION_STABILITY_STATE,
  );
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
        (position) =>
          processDevicePosition(
            position,
            sessionReferenceRef,
            headingTrackerRef,
            positionStabilityRef,
          ),
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
    headingTrackerRef.current = INITIAL_HEADING_TRACKER_STATE;
    positionStabilityRef.current = INITIAL_POSITION_STABILITY_STATE;
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

  // Arranque automático: si el navegador ya concedió el permiso en una
  // sesión anterior, el usuario no debería tener que pulsar el botón de
  // ubicación para ver su posición — ese clic solo debe hacer falta cuando
  // el permiso todavía no existe (`prompt`) o el navegador exige un gesto
  // explícito para pedirlo. checkDeviceLocationPermission() nunca dispara el
  // diálogo nativo por sí sola (solo lee el estado), así que es seguro
  // llamarla siempre al montar. startTracking() ya es un no-op seguro si
  // otra instancia de este hook (ej. el panel de diagnóstico) ya inició el
  // mismo watch — ver isDeviceLocationWatchActive().
  useEffect(() => {
    let cancelled = false;
    checkDeviceLocationPermission().then((nextPermission) => {
      if (cancelled) return;
      useDeviceLocationStore.getState().setPermission(nextPermission);
      if (nextPermission === "granted") {
        void startTracking();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [startTracking]);

  return {
    movementHeadingDegrees,
    smoothedHeadingDegrees,
    status,
    permission,
    rawPosition,
    filteredPosition,
    confirmedPosition,
    confirmedAccuracyQuality,
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
