import { describe, expect, it } from "vitest";
import { getCompassRotationDegrees } from "./compass-orientation";

describe("getCompassRotationDegrees", () => {
  const north = { x: 0, z: -1 };

  it("keeps north at the top when the camera faces north", () => {
    expect(getCompassRotationDegrees({ x: 0, z: -1 }, north)).toBeCloseTo(0);
  });

  it("moves north to the left when the camera faces east", () => {
    expect(getCompassRotationDegrees({ x: 1, z: 0 }, north)).toBeCloseTo(-90);
  });

  it("shows south at the top when the camera faces south", () => {
    expect(Math.abs(getCompassRotationDegrees({ x: 0, z: 1 }, north))).toBeCloseTo(180);
  });
});
