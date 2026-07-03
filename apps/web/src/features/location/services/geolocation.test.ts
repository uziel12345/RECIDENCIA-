import { describe, expect, it } from "vitest";
import { haversineMeters } from "./geolocation";

describe("haversineMeters", () => {
  it("returns 0 for identical coordinates", () => {
    expect(haversineMeters(17.06, -96.72, 17.06, -96.72)).toBe(0);
  });

  it("returns ~111 km for one degree of latitude difference", () => {
    const result = haversineMeters(0, 0, 1, 0);
    expect(result).toBeCloseTo(111_195, -2); // within ~100 m
  });

  it("returns ~111 km for one degree of longitude at the equator", () => {
    const result = haversineMeters(0, 0, 0, 1);
    expect(result).toBeCloseTo(111_195, -2);
  });

  it("returns a smaller value for one degree of longitude away from equator", () => {
    // At lat=45°, 1° lon ≈ 78.85 km (cos(45°) * 111.195)
    const result = haversineMeters(45, 0, 45, 1);
    expect(result).toBeCloseTo(78_626, -2);
  });

  it("is symmetric — distance A→B equals B→A", () => {
    const ab = haversineMeters(17.06, -96.72, 17.07, -96.71);
    const ba = haversineMeters(17.07, -96.71, 17.06, -96.72);
    expect(ab).toBeCloseTo(ba, 5);
  });

  it("returns a positive value for two close points on campus", () => {
    // Two distinct points within ITO campus (~meters apart)
    const result = haversineMeters(17.0625, -96.7215, 17.0627, -96.7213);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(50); // well under 50 m
  });
});
