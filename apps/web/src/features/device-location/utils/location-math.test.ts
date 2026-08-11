import { describe, expect, it } from "vitest";
import {
  angleDifferenceDegrees,
  calculateBearingDegrees,
  degreesToRadians,
  getLocationQuality,
  haversineDistanceMeters,
  normalizeAngleDegrees,
  smoothHeadingDegrees,
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

describe("normalizeAngleDegrees", () => {
  it("deja intactos los ángulos ya en [0,360)", () => {
    expect(normalizeAngleDegrees(0)).toBe(0);
    expect(normalizeAngleDegrees(180)).toBe(180);
    expect(normalizeAngleDegrees(359)).toBe(359);
  });

  it("envuelve ángulos negativos y mayores a 360", () => {
    expect(normalizeAngleDegrees(-10)).toBeCloseTo(350);
    expect(normalizeAngleDegrees(370)).toBeCloseTo(10);
    expect(normalizeAngleDegrees(-720)).toBeCloseTo(0);
  });
});

describe("angleDifferenceDegrees", () => {
  it("da 0 para ángulos iguales", () => {
    expect(angleDifferenceDegrees(90, 90)).toBeCloseTo(0);
  });

  it("da la diferencia con signo por el camino más corto", () => {
    expect(angleDifferenceDegrees(100, 90)).toBeCloseTo(10);
    expect(angleDifferenceDegrees(90, 100)).toBeCloseTo(-10);
  });

  it("cruza el borde 359°/0° como un cambio pequeño, no de 358°", () => {
    expect(angleDifferenceDegrees(1, 359)).toBeCloseTo(2);
    expect(angleDifferenceDegrees(359, 1)).toBeCloseTo(-2);
  });

  it("nunca excede ±180", () => {
    expect(angleDifferenceDegrees(0, 180)).toBeCloseTo(-180);
    expect(Math.abs(angleDifferenceDegrees(10, 350))).toBeLessThanOrEqual(180);
  });
});

describe("calculateBearingDegrees", () => {
  it("da 0° cuando el desplazamiento es directamente hacia el norte", () => {
    const bearing = calculateBearingDegrees(
      { latitude: 17.07, longitude: -96.74 },
      { latitude: 17.071, longitude: -96.74 },
    );
    expect(bearing).not.toBeNull();
    expect(bearing ?? NaN).toBeCloseTo(0, 0);
  });

  it("da ~90° cuando el desplazamiento es directamente hacia el este", () => {
    const bearing = calculateBearingDegrees(
      { latitude: 17.07, longitude: -96.74 },
      { latitude: 17.07, longitude: -96.739 },
    );
    expect(bearing).not.toBeNull();
    expect(bearing ?? NaN).toBeCloseTo(90, 0);
  });

  it("da ~180° hacia el sur y ~270° hacia el oeste", () => {
    const south = calculateBearingDegrees(
      { latitude: 17.07, longitude: -96.74 },
      { latitude: 17.069, longitude: -96.74 },
    );
    const west = calculateBearingDegrees(
      { latitude: 17.07, longitude: -96.74 },
      { latitude: 17.07, longitude: -96.741 },
    );
    expect(south ?? NaN).toBeCloseTo(180, 0);
    expect(west ?? NaN).toBeCloseTo(270, 0);
  });

  it("null ante coordenadas no finitas", () => {
    expect(
      calculateBearingDegrees(
        { latitude: Number.NaN, longitude: 0 },
        { latitude: 1, longitude: 0 },
      ),
    ).toBeNull();
  });

  it("es independiente de la rotación de cámara/mapa: no recibe ni usa ese parámetro", () => {
    // No hay forma de "rotar" este resultado desde fuera — a diferencia del
    // rumbo relativo a pantalla (destination-bearing.ts), esta función solo
    // toma lat/lon. Este test documenta esa garantía de diseño.
    expect(calculateBearingDegrees.length).toBe(2);
  });
});

describe("smoothHeadingDegrees", () => {
  it("adopta el primer rumbo tal cual cuando no hay uno previo", () => {
    expect(smoothHeadingDegrees(45, null, 0.35)).toBeCloseTo(45);
  });

  it("se mueve progresivamente hacia el nuevo rumbo, no de golpe", () => {
    const next = smoothHeadingDegrees(90, 0, 0.5);
    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(90);
  });

  it("cruza 359°→1° como un paso corto (2°), no gira los 358° largos", () => {
    const next = smoothHeadingDegrees(1, 359, 0.5);
    // El tramo completo por el camino corto es 2°; con alpha=0.5 debe haber
    // avanzado ~1° desde 359 (es decir, dar cerca de 360≡0), nunca haber
    // saltado hacia el lado largo (~180°).
    expect(Math.abs(angleDifferenceDegrees(next, 359))).toBeCloseTo(1, 0);
    expect(Math.abs(angleDifferenceDegrees(next, 0))).toBeLessThan(1);
  });

  it("alpha=1 salta directo al rumbo nuevo", () => {
    expect(smoothHeadingDegrees(200, 10, 1)).toBeCloseTo(200);
  });
});
