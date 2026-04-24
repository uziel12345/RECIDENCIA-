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

export function startUserLocationTracking(): void {
  const {
    setPermission,
    setGeoPosition,
    setMapPosition,
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

      setPermission("granted");

      if (
        accuracy !== null &&
        accuracy > MAX_ACCEPTABLE_ACCURACY_METERS &&
        lastAcceptedPosition
      ) {
        setGeoPosition(lastAcceptedPosition);
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

      const acceptedPosition: GeoLikePosition = {
        latitude,
        longitude,
        accuracy,
      };

      lastAcceptedPosition = acceptedPosition;

      setErrorMessage(null);
      setGeoPosition(acceptedPosition);

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
  const { watchId, setWatchId } = useLocationStore.getState();

  if (watchId !== null && "geolocation" in navigator) {
    navigator.geolocation.clearWatch(watchId);
    setWatchId(null);
  }
}