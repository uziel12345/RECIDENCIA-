import { describe, expect, it } from "vitest";
import {
  degreesToRadians,
  getLocationQuality,
  haversineDistanceMeters,
} from "./location-math";

describe("location-math", () => {
  it("convierte grados a radianes", () => {
    expect(degreesToRadians(180)).toBeCloseTo(Math.PI, 12);
    expect(degreesToRadians(90)).toBeCloseTo(Math.PI / 2, 12);
  });

  it("calcula distancia Haversine en metros", () => {
    const distance = haversineDistanceMeters(
      { latitude: 0, longitude: 0 },
      { latitude: 1, longitude: 0 },
    );
    expect(distance).not.toBeNull();
    expect(distance ?? 0).toBeCloseTo(111_194.93, 1);
  });

  it("clasifica los límites de precisión centralizados", () => {
    expect(getLocationQuality(5)).toBe("excellent");
    expect(getLocationQuality(15)).toBe("good");
    expect(getLocationQuality(35)).toBe("regular");
    expect(getLocationQuality(35.01)).toBe("poor");
  });

  it("no devuelve NaN ante coordenadas no finitas", () => {
    const distance = haversineDistanceMeters(
      { latitude: Number.NaN, longitude: 0 },
      { latitude: 1, longitude: 0 },
    );
    expect(distance).toBeNull();
  });
});
