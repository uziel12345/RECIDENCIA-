import { Geolocation } from "@capacitor/geolocation";
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
    confidence: "high",
    method: "manual",
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

// Usa el plugin de Capacitor en vez de navigator.geolocation directo: dentro
// del WebView nativo (Android/iOS empaquetados), la API del navegador no
// dispara el diálogo de permiso nativo de forma confiable. El plugin sí lo
// hace, y en la web sigue funcionando igual (ahí es un envoltorio delgado
// sobre navigator.geolocation).
export async function startUserLocationTracking(): Promise<void> {
  const store = useLocationStore.getState();

  if (store.watchId !== null) return;

  try {
    const status = await Geolocation.checkPermissions();
    if (status.location !== "granted") {
      const requested = await Geolocation.requestPermissions();
      if (requested.location !== "granted") {
        store.setPermission("denied");
        store.setErrorMessage("El usuario denegó el permiso de ubicación.");
        return;
      }
    }
  } catch {
    store.setPermission("unsupported");
    store.setErrorMessage("Este dispositivo no soporta geolocalización.");
    return;
  }

  const newWatchId = await Geolocation.watchPosition(
    { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 },
    (position, err) => {
      const currentStore = useLocationStore.getState();

      if (err || !position) {
        currentStore.setErrorMessage(
          (err && typeof err === "object" && "message" in err
            ? String((err as { message: unknown }).message)
            : null) || "No se pudo obtener la ubicación."
        );
        return;
      }

      const received: GeoLikePosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? null,
      };

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
    }
  );

  useLocationStore.getState().setWatchId(newWatchId);
}

export async function stopUserLocationTracking(): Promise<void> {
  const { watchId, setWatchId } = useLocationStore.getState();
  if (watchId === null) return;

  // Limpia el id ANTES de esperar a clearWatch: si un startUserLocationTracking()
  // se dispara mientras este await sigue pendiente (típico al reanudar la app
  // tras minimizarla), su guardia "watchId !== null" no debe ver un id viejo
  // y abortar — así queda claro de inmediato que no hay watch activo.
  setWatchId(null);
  lastAcceptedPosition = null;
  try {
    await Geolocation.clearWatch({ id: watchId });
  } catch {
    // El watch ya pudo haberse invalidado del lado nativo (ej. la app
    // estuvo en segundo plano) — no hay nada que limpiar en ese caso.
  }
}


