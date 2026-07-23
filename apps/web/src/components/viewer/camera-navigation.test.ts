import { describe, expect, it } from "vitest";
import { getClampedZoomDistance } from "./camera-navigation";

describe("camera navigation", () => {
  it("acerca y aleja dentro de los límites", () => {
    expect(getClampedZoomDistance(100, -1, 20, 700)).toBeCloseTo(82);
    expect(getClampedZoomDistance(100, 1, 20, 700)).toBeCloseTo(118);
  });

  it("llega al límite en vez de ignorar el último gesto", () => {
    expect(getClampedZoomDistance(22, -1, 20, 700)).toBe(20);
    expect(getClampedZoomDistance(690, 1, 20, 700)).toBe(700);
  });

  it("tolera límites invertidos o una distancia no válida", () => {
    expect(getClampedZoomDistance(Number.NaN, -1, 700, 20)).toBe(20);
  });
});
