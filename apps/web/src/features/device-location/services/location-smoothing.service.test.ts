import { describe, expect, it } from "vitest";
import type { DeviceGeoPosition } from "../types/device-location.types";
import { smoothGeoPosition } from "./location-smoothing.service";

function position(
  latitude: number,
  longitude: number,
  accuracy: number,
): DeviceGeoPosition {
  return {
    latitude,
    longitude,
    accuracy,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
    timestamp: 1_000,
  };
}

describe("smoothGeoPosition", () => {
  it("usa la primera lectura tal cual, sin nada que suavizar", () => {
    const raw = position(17, -96, 8);
    expect(smoothGeoPosition(raw, null)).toBe(raw);
  });

  it("una lectura precisa mueve la posición casi por completo hacia el nuevo valor", () => {
    const previous = position(17, -96, 5);
    const raw = position(17.001, -96, 5);
    const result = smoothGeoPosition(raw, previous);

    // alpha en el techo (0.9): queda muy cerca del valor nuevo, lejos del anterior.
    const movedFraction =
      (result.latitude - previous.latitude) / (raw.latitude - previous.latitude);
    expect(movedFraction).toBeCloseTo(0.9, 5);
  });

  it("una lectura ruidosa (precisión pobre) apenas desplaza la posición — no persigue el bandazo", () => {
    const previous = position(17, -96, 5);
    const raw = position(17.001, -96, 200);
    const result = smoothGeoPosition(raw, previous);

    // alpha en el piso (0.15): se queda mucho más cerca de la posición
    // anterior que del bandazo nuevo.
    const movedFraction =
      (result.latitude - previous.latitude) / (raw.latitude - previous.latitude);
    expect(movedFraction).toBeCloseTo(0.15, 2);
  });

  it("nunca sobrepasa la lectura nueva ni retrocede más allá de la anterior", () => {
    const previous = position(17, -96, 5);
    const raw = position(17.001, -96, 1);
    const result = smoothGeoPosition(raw, previous);

    expect(result.latitude).toBeGreaterThanOrEqual(previous.latitude);
    expect(result.latitude).toBeLessThanOrEqual(raw.latitude);
  });

  it("conserva accuracy y timestamp de la lectura cruda, solo suaviza lat/lon", () => {
    const previous = position(17, -96, 5);
    const raw = { ...position(17.001, -96.001, 12), timestamp: 5_000 };
    const result = smoothGeoPosition(raw, previous);

    expect(result.accuracy).toBe(12);
    expect(result.timestamp).toBe(5_000);
  });
});
