import { useLocationStore } from "../../../store/location-store";
import { mapGeoToCampusCoordinates } from "../utils/coordinate-mapper";

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
      setErrorMessage(null);

      setGeoPosition({
        latitude,
        longitude,
        accuracy,
      });

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
      maximumAge: 5000,
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