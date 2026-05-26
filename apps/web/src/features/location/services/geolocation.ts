import { useLocationStore } from "../../../store/location-store";
import { mapGeoToCampusCoordinates } from "../utils/coordinate-mapper";

const MAX_ACCEPTABLE_ACCURACY_METERS = 60;
const MIN_MOVEMENT_METERS = 3;

type GeoLikePosition = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

type LocationTrackingOptions = {
  isMobile?: boolean;
};

type MobileSnapZone = {
  buildingName: string;
  centerX: number;
  centerZ: number;
  radius: number;
  bounds?: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
};

const MOBILE_SNAP_ZONES: MobileSnapZone[] = [
  {
    buildingName: "Centro de Cómputo",
    centerX: 0.7661,
    centerZ: -126.9385,
    radius: 140,
    bounds: {
      minX: -20,
      maxX: 95,
      minZ: -185,
      maxZ: -75,
    },
  },
];

let lastAcceptedPosition: GeoLikePosition | null = null;
let activeTrackingIsMobile = false;

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

function applyMobileSnapToCampusPosition(
  mapPosition: ReturnType<typeof mapGeoToCampusCoordinates>
): ReturnType<typeof mapGeoToCampusCoordinates> {
  for (const zone of MOBILE_SNAP_ZONES) {
    const isInsideBounds = zone.bounds
      ? mapPosition.x >= zone.bounds.minX &&
        mapPosition.x <= zone.bounds.maxX &&
        mapPosition.z >= zone.bounds.minZ &&
        mapPosition.z <= zone.bounds.maxZ
      : false;
    const distance = Math.hypot(
      mapPosition.x - zone.centerX,
      mapPosition.z - zone.centerZ
    );

    if (isInsideBounds || distance <= zone.radius) {
      return {
        x: zone.centerX,
        y: mapPosition.y,
        z: zone.centerZ,
      };
    }
  }

  return mapPosition;
}

function mapGeoToCampusCoordinatesForDevice(
  latitude: number,
  longitude: number,
  options: LocationTrackingOptions
): ReturnType<typeof mapGeoToCampusCoordinates> {
  const mapPosition = mapGeoToCampusCoordinates(latitude, longitude);

  if (!options.isMobile) {
    return mapPosition;
  }

  return applyMobileSnapToCampusPosition(mapPosition);
}

export function applyManualCalibration(input: {
  buildingId: string;
  buildingName: string;
  targetX: number;
  targetZ: number;
}): void {
  const {
    setPermission,
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

  setPermission("granted");
  setIsLowAccuracy(false);
  setErrorMessage(null);
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

export function startUserLocationTracking(
  options: LocationTrackingOptions = {}
): void {
  const {
    setPermission,
    setGeoPosition,
    setMapPosition,
    setIsLowAccuracy,
    setErrorMessage,
    setWatchId,
    watchId,
  } = useLocationStore.getState();
  const isMobile = options.isMobile ?? false;

  if (!("geolocation" in navigator)) {
    setPermission("unsupported");
    setErrorMessage("Tu navegador no soporta geolocalización.");
    return;
  }

  if (watchId !== null && activeTrackingIsMobile === isMobile) {
    return;
  }

  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    setWatchId(null);
    lastAcceptedPosition = null;
  }

  activeTrackingIsMobile = isMobile;

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

        const mapPosition = mapGeoToCampusCoordinatesForDevice(
          lastAcceptedPosition.latitude,
          lastAcceptedPosition.longitude,
          { isMobile }
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

        const approximateMapPosition = mapGeoToCampusCoordinatesForDevice(
          latitude,
          longitude,
          { isMobile }
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

      const mapPosition = mapGeoToCampusCoordinatesForDevice(
        latitude,
        longitude,
        { isMobile }
      );
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
