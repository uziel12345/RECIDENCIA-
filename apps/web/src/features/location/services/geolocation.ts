import { useLocationStore } from "../../../store/location-store";
import { mapGeoToCampusCoordinates } from "../utils/coordinate-mapper";

const MAX_ACCEPTABLE_ACCURACY_METERS = 35;
const MIN_MOVEMENT_METERS = 2;

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
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

function handleAcceptedPosition(position: GeolocationPosition): void {
  const { setPermission, setGeoPosition, setMapPosition, setErrorMessage } =
    useLocationStore.getState();

  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  const accuracy = position.coords.accuracy ?? null;

  console.log("Precisión GPS:", accuracy, "metros");

  setPermission("granted");

  if (accuracy !== null && accuracy > MAX_ACCEPTABLE_ACCURACY_METERS) {
    if (lastAcceptedPosition) {
      setGeoPosition(lastAcceptedPosition);
      setMapPosition(
        mapGeoToCampusCoordinates(
          lastAcceptedPosition.latitude,
          lastAcceptedPosition.longitude
        )
      );

      setErrorMessage(
        `Precisión baja (${accuracy.toFixed(
          1
        )} m). Mostrando la última ubicación válida.`
      );
      return;
    }

    setErrorMessage(
      `Precisión baja (${accuracy.toFixed(
        1
      )} m). No se moverá el marcador hasta obtener una ubicación más precisa.`
    );
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
  setMapPosition(mapGeoToCampusCoordinates(latitude, longitude));
}

function handleLocationError(error: GeolocationPositionError): void {
  const { setPermission, setErrorMessage } = useLocationStore.getState();

  if (error.code === error.PERMISSION_DENIED) {
    setPermission("denied");
    setErrorMessage("Permiso de ubicación denegado.");
    return;
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    setErrorMessage(
      "No se pudo obtener la ubicación. Activa el GPS y revisa los permisos del navegador."
    );
    return;
  }

  if (error.code === error.TIMEOUT) {
    setErrorMessage(
      "La ubicación tardó demasiado. Intenta de nuevo en un lugar abierto."
    );
    return;
  }

  setErrorMessage("No se pudo obtener la ubicación.");
}

export function startUserLocationTracking(): void {
  const { setPermission, setErrorMessage, setWatchId, watchId } =
    useLocationStore.getState();

  if (!("geolocation" in navigator)) {
    setPermission("unsupported");
    setErrorMessage("Tu navegador no soporta geolocalización.");
    return;
  }

  if (!window.isSecureContext) {
    setErrorMessage(
      "La ubicación en celular requiere HTTPS. Abre la app desde el enlace HTTPS de ngrok."
    );
    return;
  }

  if (watchId !== null) {
    return;
  }

  setErrorMessage("Solicitando ubicación...");

  navigator.geolocation.getCurrentPosition(
    handleAcceptedPosition,
    handleLocationError,
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 20000,
    }
  );

  const newWatchId = navigator.geolocation.watchPosition(
    handleAcceptedPosition,
    handleLocationError,
    {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 20000,
    }
  );

  setWatchId(newWatchId);
}

export function stopUserLocationTracking(): void {
  const { watchId, setWatchId, setErrorMessage } = useLocationStore.getState();

  if (watchId !== null && "geolocation" in navigator) {
    navigator.geolocation.clearWatch(watchId);
    setWatchId(null);
    setErrorMessage(null);
  }
}