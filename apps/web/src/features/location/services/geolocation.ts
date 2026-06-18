import { useLocationStore } from "../../../store/location-store";
import type { SimulatedPosition } from "../../../store/location-store";

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

export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6_371_000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function setSimulatedPosition(sim: SimulatedPosition): void {
  const store = useLocationStore.getState();
  store.setSimulatedPosition(sim);
  store.setMapPosition({ x: sim.x, y: 2, z: sim.z });
  store.setNearestBuilding({
    buildingId: sim.buildingId,
    buildingCode: "",
    buildingName: sim.buildingName,
    distanceMeters: 0,
  });
  store.setPermission("granted");
  store.setErrorMessage(null);
}

export function clearSimulatedPosition(): void {
  const store = useLocationStore.getState();
  store.setSimulatedPosition(null);
  store.setNearestBuilding(null);
  store.setErrorMessage(null);
  if (!store.geoPosition) {
    store.setMapPosition(null);
  }
}

export function startUserLocationTracking(): void {
  const store = useLocationStore.getState();

  if (!("geolocation" in navigator)) {
    store.setPermission("unsupported");
    store.setErrorMessage("Tu navegador no soporta geolocalización.");
    return;
  }

  if (store.watchId !== null) return;

  const newWatchId = navigator.geolocation.watchPosition(
    (position) => {
      const received: GeoLikePosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? null,
      };

      const currentStore = useLocationStore.getState();
      currentStore.setPermission("granted");

      if (currentStore.simulatedPosition) {
        currentStore.setGeoPosition(received);
        return;
      }

      const accuracy = received.accuracy;

      if (accuracy !== null && accuracy > MAX_ACCEPTABLE_ACCURACY_METERS) {
        if (lastAcceptedPosition) {
          currentStore.setGeoPosition(lastAcceptedPosition);
          currentStore.setErrorMessage(
            `Precisión baja (${accuracy.toFixed(0)} m). Mostrando última ubicación válida.`
          );
        } else {
          currentStore.setGeoPosition(received);
          currentStore.setErrorMessage(
            `Ubicación aproximada (${accuracy.toFixed(0)} m). Acércate a una ventana para mejorar la señal.`
          );
        }
        return;
      }

      if (lastAcceptedPosition) {
        const moved = haversineMeters(
          lastAcceptedPosition.latitude,
          lastAcceptedPosition.longitude,
          received.latitude,
          received.longitude
        );
        if (moved < MIN_MOVEMENT_METERS) return;
      }

      lastAcceptedPosition = received;
      currentStore.setGeoPosition(received);
      currentStore.setErrorMessage(null);
    },
    (error) => {
      const s = useLocationStore.getState();
      if (error.code === error.PERMISSION_DENIED) {
        s.setPermission("denied");
        s.setErrorMessage("El usuario denegó el permiso de ubicación.");
        return;
      }
      s.setErrorMessage(error.message || "No se pudo obtener la ubicación.");
    },
    { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
  );

  store.setWatchId(newWatchId);
}

export function stopUserLocationTracking(): void {
  const { watchId, setWatchId } = useLocationStore.getState();
  if (watchId !== null && "geolocation" in navigator) {
    navigator.geolocation.clearWatch(watchId);
    setWatchId(null);
  }
  lastAcceptedPosition = null;
}
