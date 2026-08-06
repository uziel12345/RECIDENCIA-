import { Capacitor } from "@capacitor/core";
import {
  Geolocation,
  type Position as CapacitorPosition,
} from "@capacitor/geolocation";
import { DEVICE_LOCATION_WATCH_OPTIONS } from "../config/campus-location.config";
import type {
  DeviceGeoPosition,
  DeviceLocationPermission,
} from "../types/device-location.types";

export type DeviceLocationCallback = (position: DeviceGeoPosition) => void;
export type DeviceLocationErrorCallback = (message: string) => void;

let activeWatchId: string | null = null;
let pendingWatchId: Promise<string> | null = null;
let watchGeneration = 0;

function finiteOrNull(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizePosition(
  position: CapacitorPosition,
): DeviceGeoPosition | null {
  const { coords } = position;
  if (
    !Number.isFinite(coords.latitude) ||
    !Number.isFinite(coords.longitude) ||
    !Number.isFinite(coords.accuracy) ||
    coords.latitude < -90 ||
    coords.latitude > 90 ||
    coords.longitude < -180 ||
    coords.longitude > 180 ||
    coords.accuracy < 0
  ) {
    return null;
  }

  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy,
    altitude: finiteOrNull(coords.altitude),
    altitudeAccuracy: finiteOrNull(coords.altitudeAccuracy),
    heading: finiteOrNull(coords.heading),
    speed: finiteOrNull(coords.speed),
    timestamp: Number.isFinite(position.timestamp)
      ? position.timestamp
      : Date.now(),
  };
}

function mapPermission(permission: unknown): DeviceLocationPermission {
  if (permission === "granted") return "granted";
  if (permission === "denied") return "denied";
  if (permission === "prompt" || permission === "prompt-with-rationale") {
    return "prompt";
  }
  return "unknown";
}

function readErrorProperty(error: unknown, property: "code" | "message") {
  if (typeof error !== "object" || error === null || !(property in error)) {
    return null;
  }
  const value = (error as Record<string, unknown>)[property];
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : null;
}

export function translateDeviceLocationError(error: unknown): string {
  const code = readErrorProperty(error, "code")?.toLowerCase() ?? "";
  const message = readErrorProperty(error, "message")?.toLowerCase() ?? "";

  if (
    code === "1" ||
    code.endsWith("0003") ||
    code.includes("denied") ||
    message.includes("denied") ||
    message.includes("permission") ||
    message.includes("permiso") ||
    message.includes("permissions policy")
  ) {
    return "El permiso de ubicación está bloqueado. Abre el candado junto a la dirección del sitio, permite Ubicación y vuelve a intentarlo.";
  }
  if (
    code === "2" ||
    code.endsWith("0007") ||
    code.endsWith("0009") ||
    code.endsWith("0017") ||
    message.includes("unavailable") ||
    message.includes("location services")
  ) {
    return "La ubicación no está disponible. Activa la ubicación/GPS del dispositivo y vuelve a intentarlo.";
  }
  if (
    code === "3" ||
    code.endsWith("0010") ||
    message.includes("timeout") ||
    message.includes("timed out")
  ) {
    return "El dispositivo tardó demasiado en ubicarte. Activa el GPS y Wi-Fi, acércate a una ventana o sal a un espacio abierto e inténtalo nuevamente.";
  }
  if (
    message.includes("secure origin") ||
    message.includes("secure context") ||
    message.includes("only secure")
  ) {
    return "La ubicación requiere una conexión HTTPS segura. Abre el enlace oficial de producción e inténtalo de nuevo.";
  }
  return "No se pudo obtener la ubicación. Revisa el permiso del sitio y que la ubicación/GPS del dispositivo esté activada.";
}

export function isDeviceGeolocationSupported(): boolean {
  if (Capacitor.isNativePlatform()) return true;
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

export async function checkDeviceLocationPermission(): Promise<DeviceLocationPermission> {
  if (!isDeviceGeolocationSupported()) return "unknown";
  if (Capacitor.isNativePlatform()) {
    const permissions = await Geolocation.checkPermissions();
    return mapPermission(permissions.location);
  }

  // Capacitor delega en Permissions API para web, pero Safari y algunos
  // WebView no la implementan. En esos casos el navegador debe mostrar el
  // prompt cuando se solicite una lectura real.
  if (!navigator.permissions?.query) return "prompt";
  try {
    const permission = await navigator.permissions.query({
      name: "geolocation",
    });
    return mapPermission(permission.state);
  } catch {
    return "prompt";
  }
}

export async function requestDeviceLocationPermission(): Promise<DeviceLocationPermission> {
  if (!isDeviceGeolocationSupported()) return "unknown";
  if (Capacitor.isNativePlatform()) {
    const permissions = await Geolocation.requestPermissions();
    return mapPermission(permissions.location);
  }

  // requestPermissions() de @capacitor/geolocation no está implementado en
  // web. getCurrentPosition es la API que abre el prompt de Chrome/Safari y
  // confirma que, además del permiso, el servicio de ubicación está activo.
  return new Promise<DeviceLocationPermission>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve("granted"),
      (error) => {
        if (error.code === 1) {
          resolve("denied");
          return;
        }
        reject(error);
      },
      DEVICE_LOCATION_WATCH_OPTIONS,
    );
  });
}

export function isDeviceLocationWatchActive(): boolean {
  return activeWatchId !== null || pendingWatchId !== null;
}

export async function startDeviceLocationWatch(
  onPosition: DeviceLocationCallback,
  onError: DeviceLocationErrorCallback,
): Promise<boolean> {
  if (activeWatchId !== null || pendingWatchId !== null) return false;

  const generation = ++watchGeneration;
  const watchPromise = Geolocation.watchPosition(
    DEVICE_LOCATION_WATCH_OPTIONS,
    (position, error) => {
      if (generation !== watchGeneration) return;
      if (error) {
        onError(translateDeviceLocationError(error));
        return;
      }
      if (!position) {
        onError("El GPS no entregó una lectura válida.");
        return;
      }

      const normalized = normalizePosition(position);
      if (!normalized) {
        onError("El GPS entregó coordenadas inválidas.");
        return;
      }
      onPosition(normalized);
    },
  );
  pendingWatchId = watchPromise;

  try {
    const watchId = await watchPromise;
    if (generation !== watchGeneration) {
      await Geolocation.clearWatch({ id: watchId }).catch(() => undefined);
      return false;
    }
    activeWatchId = watchId;
    return true;
  } finally {
    if (pendingWatchId === watchPromise) pendingWatchId = null;
  }
}

export async function stopDeviceLocationWatch(): Promise<void> {
  watchGeneration += 1;
  const watchId = activeWatchId;
  const startInProgress = pendingWatchId;
  activeWatchId = null;

  if (watchId !== null) {
    await Geolocation.clearWatch({ id: watchId }).catch(() => undefined);
  }
  if (startInProgress) {
    await startInProgress.catch(() => undefined);
  }
}

export async function disposeDeviceGeolocation(): Promise<void> {
  await stopDeviceLocationWatch();
}
