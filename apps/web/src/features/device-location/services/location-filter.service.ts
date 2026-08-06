import { LOCATION_FILTER_CONFIG } from "../config/campus-location.config";
import type {
  DeviceGeoPosition,
  LocationFilterResult,
} from "../types/device-location.types";
import {
  haversineDistanceMeters,
  isFiniteGeoPoint,
} from "../utils/location-math";

function invalidResult(): LocationFilterResult {
  return {
    accepted: false,
    position: null,
    distanceMeters: null,
    elapsedSeconds: null,
    estimatedSpeedMetersPerSecond: null,
    reason: "invalid-reading",
  };
}

export function filterDeviceLocation(
  received: DeviceGeoPosition,
  lastAccepted: DeviceGeoPosition | null,
): LocationFilterResult {
  if (
    !isFiniteGeoPoint(received) ||
    !Number.isFinite(received.accuracy) ||
    received.accuracy < 0 ||
    !Number.isFinite(received.timestamp)
  ) {
    return invalidResult();
  }

  if (!lastAccepted) {
    return {
      accepted: true,
      position: received,
      distanceMeters: 0,
      elapsedSeconds: null,
      estimatedSpeedMetersPerSecond: null,
      reason: "first-reading",
    };
  }

  const distanceMeters = haversineDistanceMeters(lastAccepted, received);
  if (distanceMeters === null) return invalidResult();

  const elapsedMilliseconds = received.timestamp - lastAccepted.timestamp;
  const elapsedSeconds = elapsedMilliseconds > 0
    ? elapsedMilliseconds / 1_000
    : null;
  const estimatedSpeedMetersPerSecond = elapsedSeconds
    ? distanceMeters / elapsedSeconds
    : null;
  const exceedsJump =
    distanceMeters > LOCATION_FILTER_CONFIG.maximumAcceptedJumpMeters;
  const exceedsWalkingSpeed =
    estimatedSpeedMetersPerSecond !== null &&
    estimatedSpeedMetersPerSecond >
      LOCATION_FILTER_CONFIG.maximumWalkingSpeedMetersPerSecond;

  if (exceedsJump || exceedsWalkingSpeed) {
    return {
      accepted: false,
      position: lastAccepted,
      distanceMeters,
      elapsedSeconds,
      estimatedSpeedMetersPerSecond,
      reason: "impossible-jump",
    };
  }

  return {
    accepted: true,
    position: received,
    distanceMeters,
    elapsedSeconds,
    estimatedSpeedMetersPerSecond,
    reason:
      distanceMeters < LOCATION_FILTER_CONFIG.minimumMovementMeters
        ? "small-movement"
        : "accepted",
  };
}
