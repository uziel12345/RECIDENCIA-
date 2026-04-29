import type { NavigationNode } from "../types/navigation.types.ts";

export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters)) return "0 m";

  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0 min";

  if (seconds < 60) {
    return `${Math.round(seconds)} seg`;
  }

  const minutes = Math.round(seconds / 60);

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours} h ${remainingMinutes} min`;
}

export function distanceBetweenNodes(
  a: NavigationNode,
  b: NavigationNode
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export const WALKING_SPEED_METERS_PER_SECOND = 1.4;

export function distanceToEstimatedSeconds(distanceMeters: number): number {
  return Math.round(distanceMeters / WALKING_SPEED_METERS_PER_SECOND);
}