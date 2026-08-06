import { describe, expect, it } from "vitest";
import type { DeviceGeoPosition } from "../types/device-location.types";
import { filterDeviceLocation } from "./location-filter.service";

function position(
  latitude: number,
  timestamp: number,
): DeviceGeoPosition {
  return {
    latitude,
    longitude: -96,
    accuracy: 8,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
    timestamp,
  };
}

describe("filterDeviceLocation", () => {
  it("acepta la primera lectura", () => {
    const received = position(17, 1_000);
    const result = filterDeviceLocation(received, null);
    expect(result.accepted).toBe(true);
    expect(result.position).toBe(received);
    expect(result.reason).toBe("first-reading");
  });

  it("permite movimientos pequeños", () => {
    const previous = position(17, 1_000);
    const received = position(17.000_001, 2_000);
    const result = filterDeviceLocation(received, previous);
    expect(result.accepted).toBe(true);
    expect(result.reason).toBe("small-movement");
    expect(result.position).toBe(received);
  });

  it("detecta una velocidad incompatible con caminar", () => {
    const previous = position(17, 1_000);
    const received = position(17.000_1, 2_000);
    const result = filterDeviceLocation(received, previous);
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("impossible-jump");
    expect(result.position).toBe(previous);
    expect(result.estimatedSpeedMetersPerSecond).toBeGreaterThan(4);
  });

  it("detecta saltos mayores al máximo incluso sin tiempo calculable", () => {
    const previous = position(17, 1_000);
    const received = position(17.001, 1_000);
    const result = filterDeviceLocation(received, previous);
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("impossible-jump");
    expect(result.distanceMeters).toBeGreaterThan(50);
  });

  it("conserva la lectura válida previa ante datos no finitos", () => {
    const previous = position(17, 1_000);
    const received = position(Number.NaN, 2_000);
    const result = filterDeviceLocation(received, previous);
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("invalid-reading");
    expect(result.position).toBeNull();
  });
});
