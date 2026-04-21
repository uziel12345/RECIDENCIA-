import { useLocationStore } from "../../../store/location-store";
import { mapGeoToCampusCoordinates } from "../utils/coordinate-mapper";

const MAX_ACCEPTABLE_ACCURACY_METERS = 30;

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

      setGeoPosition({
        latitude,
        longitude,
        accuracy,
      });

      if (
        accuracy !== null &&
        Number.isFinite(accuracy) &&
        accuracy > MAX_ACCEPTABLE_ACCURACY_METERS
      ) {
        setErrorMessage(
          `Precisión baja (${accuracy.toFixed(
            1
          )} m). Esperando mejor señal...`
        );
        return;
      }

      try {
        const mapPosition = mapGeoToCampusCoordinates(latitude, longitude);

        setMapPosition(mapPosition);
        setErrorMessage(null);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Error al convertir coordenadas.";

        setErrorMessage(message);
      }
    },
    (error) => {
      if (error.code === error.PERMISSION_DENIED) {
        setPermission("denied");
        setErrorMessage("El usuario negó el permiso de ubicación.");
        return;
      }

      if (error.code === error.POSITION_UNAVAILABLE) {
        setErrorMessage("La ubicación no está disponible.");
        return;
      }

      if (error.code === error.TIMEOUT) {
        setErrorMessage("Tiempo de espera agotado.");
        return;
      }

      setErrorMessage(error.message || "Error de geolocalización.");
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