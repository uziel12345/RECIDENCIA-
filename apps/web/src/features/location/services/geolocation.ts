import { useLocationStore } from "../../../store/location-store";
import { mapGeoToCampusCoordinates } from "../utils/coordinate-mapper";

const TARGET_ACCURACY_METERS = 25;
const MAX_ACCEPTABLE_ACCURACY_METERS = 45;
const MIN_MOVEMENT_METERS = 1.5;

type GeoLikePosition = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

let lastAcceptedPosition: GeoLikePosition | null = null;
let bestPendingPosition: GeoLikePosition | null = null;

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

function isBetterAccuracy(
  current: GeoLikePosition,
  previous: GeoLikePosition | null
): boolean {
  if (!previous) return true;

  if (current.accuracy === null) return false;
  if (previous.accuracy === null) return true;

  return current.accuracy < previous.accuracy;
}

function isAccurateEnough(position: GeoLikePosition): boolean {
  if (position.accuracy === null) {
    return false;
  }

  return position.accuracy <= MAX_ACCEPTABLE_ACCURACY_METERS;
}

function shouldUpdateAcceptedPosition(next: GeoLikePosition): boolean {
  if (!lastAcceptedPosition) {
    return true;
  }

  const distance = distanceInMeters(
    lastAcceptedPosition.latitude,
    lastAcceptedPosition.longitude,
    next.latitude,
    next.longitude
  );

  if (distance >= MIN_MOVEMENT_METERS) {
    return true;
  }

  return isBetterAccuracy(next, lastAcceptedPosition);
}

function acceptPosition(position: GeoLikePosition): void {
  const { setGeoPosition, setMapPosition, setErrorMessage } =
    useLocationStore.getState();

  lastAcceptedPosition = position;
  bestPendingPosition = null;

  setErrorMessage(null);
  setGeoPosition(position);

  const mapPosition = mapGeoToCampusCoordinates(
    position.latitude,
    position.longitude
  );

  console.log("====== GPS ACEPTADO ======");
  console.log("GPS:", position.latitude, position.longitude);
  console.log("ACCURACY:", position.accuracy);
  console.log("MAP:", mapPosition);

  setMapPosition(mapPosition);
}

function handleLowAccuracyPosition(position: GeoLikePosition): void {
  const { setGeoPosition, setMapPosition, setErrorMessage } =
    useLocationStore.getState();

  if (isBetterAccuracy(position, bestPendingPosition)) {
    bestPendingPosition = position;
  }

  setGeoPosition(position);

  const accuracyText =
    position.accuracy !== null
      ? `${position.accuracy.toFixed(1)} m`
      : "desconocida";

  setErrorMessage(
    `Ubicación aproximada (${accuracyText}). En laptop puede variar porque el navegador no siempre usa GPS real.`
  );

  console.warn("====== GPS DE BAJA PRECISIÓN ======");
  console.warn("GPS:", position.latitude, position.longitude);
  console.warn("ACCURACY:", position.accuracy);

  if (lastAcceptedPosition) {
    const mapPosition = mapGeoToCampusCoordinates(
      lastAcceptedPosition.latitude,
      lastAcceptedPosition.longitude
    );

    setMapPosition(mapPosition);
    return;
  }

  const approximateMapPosition = mapGeoToCampusCoordinates(
    position.latitude,
    position.longitude
  );

  console.warn("====== MOSTRANDO UBICACIÓN APROXIMADA ======");
  console.warn("MAP:", approximateMapPosition);

  setMapPosition(approximateMapPosition);
}
export function startUserLocationTracking(): void {
  const { setPermission, setErrorMessage, setWatchId, watchId } =
    useLocationStore.getState();

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
      const nextPosition: GeoLikePosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? null,
      };

      setPermission("granted");

      console.log("====== GPS RECIBIDO ======");
      console.log("GPS:", nextPosition.latitude, nextPosition.longitude);
      console.log("ACCURACY:", nextPosition.accuracy);

      if (!isAccurateEnough(nextPosition)) {
        handleLowAccuracyPosition(nextPosition);
        return;
      }

      if (!shouldUpdateAcceptedPosition(nextPosition)) {
        return;
      }

      acceptPosition(nextPosition);

      if (
        nextPosition.accuracy !== null &&
        nextPosition.accuracy > TARGET_ACCURACY_METERS
      ) {
        setErrorMessage(
          `Ubicación aproximada (${nextPosition.accuracy.toFixed(
            1
          )} m). Esperando una lectura más precisa.`
        );
      }
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
      maximumAge: 0,
      timeout: 15000,
    }
  );

  setWatchId(newWatchId);
}

export function stopUserLocationTracking(): void {
  const { watchId, setWatchId } = useLocationStore.getState();

  if (watchId !== null && "geolocation" in navigator) {
    navigator.geolocation.clearWatch(watchId);
    setWatchId(null);
  }

  lastAcceptedPosition = null;
  bestPendingPosition = null;
}