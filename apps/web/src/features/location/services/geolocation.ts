import { useLocationStore } from "../../../store/location-store";
import { mapGeoToCampusCoordinates } from "../utils/coordinate-mapper";

const MAX_ACCEPTABLE_ACCURACY_METERS = 60;
const MIN_MOVEMENT_METERS = 3;

type GeoLikePosition = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

let lastAcceptedPosition: GeoLikePosition | null = null;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function distanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const earthRadius = 6371000;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

export function applyManualCalibration(input: {
  buildingId: string;
  buildingName: string;
  targetX: number;
  targetZ: number;
}): void {
  const {
    setManualCalibration,
    setMapPosition,
    setIsLowAccuracy,
    setErrorMessage,
  } = useLocationStore.getState();

  setManualCalibration({
    buildingId: input.buildingId,
    buildingName: input.buildingName,
    targetX: input.targetX,
    targetZ: input.targetZ,
  });

  setMapPosition({
    x: input.targetX,
    y: 2,
    z: input.targetZ,
  });

  setIsLowAccuracy(false);
  setErrorMessage(`Ubicación calibrada manualmente en ${input.buildingName}.`);
}

export function clearManualCalibration(): void {
  const {
    geoPosition,
    setManualCalibration,
    setMapPosition,
    setIsLowAccuracy,
    setErrorMessage,
  } = useLocationStore.getState();

  setManualCalibration(null);
  setIsLowAccuracy(false);

  if (!geoPosition) {
    setMapPosition(null);
    setErrorMessage(null);
    return;
  }

  const mapPosition = mapGeoToCampusCoordinates(
    geoPosition.latitude,
    geoPosition.longitude
  );

  setMapPosition(mapPosition);
  setErrorMessage(null);
}

export function startUserLocationTracking(): void {
  const {
    setPermission,
    setGeoPosition,
    setMapPosition,
    setIsLowAccuracy,
    setErrorMessage,
    setWatchId,
    watchId,
  } = useLocationStore.getState();

  if (!("geolocation" in navigator)) {
    setPermission("unsupported");
    setErrorMessage("Tu navegador no soporta geolocalización.");
    return;
  }

  if (watchId !== null) {
    return;
  }

  const newWatchId = navigator.geolocation.watchPosition(
    (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const accuracy = position.coords.accuracy ?? null;
      const manualCalibration = useLocationStore.getState().manualCalibration;

      const receivedPosition: GeoLikePosition = {
        latitude,
        longitude,
        accuracy,
      };

      setPermission("granted");

      if (manualCalibration) {
        setGeoPosition(receivedPosition);
        setIsLowAccuracy(false);
        return;
      }

      if (
        accuracy !== null &&
        accuracy > MAX_ACCEPTABLE_ACCURACY_METERS &&
        lastAcceptedPosition
      ) {
        setGeoPosition(lastAcceptedPosition);
        setIsLowAccuracy(true);
        setErrorMessage(
          `Precisión baja (${accuracy.toFixed(
            1
          )} m). Mostrando la última ubicación válida.`
        );

        const mapPosition = mapGeoToCampusCoordinates(
          lastAcceptedPosition.latitude,
          lastAcceptedPosition.longitude
        );

        setMapPosition(mapPosition);
        return;
      }

      if (accuracy !== null && accuracy > MAX_ACCEPTABLE_ACCURACY_METERS) {
        setGeoPosition(receivedPosition);
        setIsLowAccuracy(true);
        setErrorMessage(
          `Ubicación aproximada (${accuracy.toFixed(
            1
          )} m). En laptop puede variar porque el navegador no siempre usa GPS real.`
        );

        const approximateMapPosition = mapGeoToCampusCoordinates(
          latitude,
          longitude
        );

        setMapPosition(approximateMapPosition);
        return;
      }

      if (lastAcceptedPosition) {
        const distance = distanceInMeters(
          lastAcceptedPosition.latitude,
          lastAcceptedPosition.longitude,
          latitude,
          longitude
        );

        if (distance < MIN_MOVEMENT_METERS) {
          return;
        }
      }

      lastAcceptedPosition = receivedPosition;

      setIsLowAccuracy(false);
      setErrorMessage(null);
      setGeoPosition(receivedPosition);

      const mapPosition = mapGeoToCampusCoordinates(latitude, longitude);
      setMapPosition(mapPosition);
    },
    (error) => {
      if (error.code === error.PERMISSION_DENIED) {
        setPermission("denied");
        setErrorMessage("El usuario negó el permiso de ubicación.");
        return;
      }

      setErrorMessage(error.message || "No se pudo obtener la ubicación.");
    },
    {
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 10000,
    }
  );

  setWatchId(newWatchId);
}

export function stopUserLocationTracking(): void {
  const { watchId, setWatchId, setIsLowAccuracy } =
    useLocationStore.getState();

  if (watchId !== null && "geolocation" in navigator) {
    navigator.geolocation.clearWatch(watchId);
    setWatchId(null);
  }

  lastAcceptedPosition = null;
  setIsLowAccuracy(false);
}
