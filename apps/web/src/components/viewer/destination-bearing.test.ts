import { describe, expect, it } from "vitest";
import {
  getCompassBearingDegrees,
  getDestinationBearing,
  getScreenRelativeBearing,
  getScreenRelativeDirectionLabel,
} from "./destination-bearing";

describe("getCompassBearingDegrees", () => {
  // Vectores validados por CompassIndicator.test.ts: {x:0,z:-1}=norte,
  // {x:1,z:0}=este en el mismo espacio local del campus.
  it("da 0° cuando el destino está directamente al norte", () => {
    expect(getCompassBearingDegrees({ x: 0, z: -1 })).toBeCloseTo(0);
  });

  it("da 90° cuando el destino está directamente al este", () => {
    expect(getCompassBearingDegrees({ x: 1, z: 0 })).toBeCloseTo(90);
  });

  it("da 180° cuando el destino está directamente al sur", () => {
    expect(getCompassBearingDegrees({ x: 0, z: 1 })).toBeCloseTo(180);
  });

  it("da 270° cuando el destino está directamente al oeste", () => {
    expect(getCompassBearingDegrees({ x: -1, z: 0 })).toBeCloseTo(270);
  });

  it("da 45° para el noreste", () => {
    expect(getCompassBearingDegrees({ x: 1, z: -1 })).toBeCloseTo(45);
  });
});

describe("getDestinationBearing", () => {
  it("calcula rumbo y distancia entre dos puntos locales", () => {
    const result = getDestinationBearing({ x: 0, z: 0 }, { x: 3, z: -4 });
    expect(result).not.toBeNull();
    expect(result?.distanceModelUnits).toBeCloseTo(5);
    // {x:3,z:-4} normalizado sigue apuntando "arriba-derecha" (noreste).
    expect(result?.bearingDegrees).toBeGreaterThan(0);
    expect(result?.bearingDegrees).toBeLessThan(90);
  });

  it("regresa null cuando el usuario ya está en el destino", () => {
    expect(getDestinationBearing({ x: 10, z: 10 }, { x: 10, z: 10.001 })).toBeNull();
  });

  it("es independiente del origen: solo importa el vector entre los puntos", () => {
    const a = getDestinationBearing({ x: 0, z: 0 }, { x: 5, z: -5 });
    const b = getDestinationBearing({ x: 100, z: 200 }, { x: 105, z: 195 });
    expect(a?.bearingDegrees).toBeCloseTo(b?.bearingDegrees ?? NaN);
    expect(a?.distanceModelUnits).toBeCloseTo(b?.distanceModelUnits ?? NaN);
  });
});

describe("getScreenRelativeBearing", () => {
  it("con la cámara sin rotar, coincide con el rumbo real", () => {
    expect(getScreenRelativeBearing(0, 0)).toBeCloseTo(0);
    expect(getScreenRelativeBearing(90, 0)).toBeCloseTo(90);
  });

  it("compone rumbo real + rotación de cámara, envolviendo a 0-360", () => {
    expect(getScreenRelativeBearing(350, 20)).toBeCloseTo(10);
    expect(getScreenRelativeBearing(0, -90)).toBeCloseTo(270);
  });

  it("nunca revienta ni sale del rango [0,360) con ángulos extremos", () => {
    const result = getScreenRelativeBearing(-450, -720);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(360);
  });
});

describe("getScreenRelativeDirectionLabel", () => {
  it("con la cámara sin rotar, el rumbo real coincide con la posición en pantalla", () => {
    expect(getScreenRelativeDirectionLabel(0, 0)).toBe("adelante");
    expect(getScreenRelativeDirectionLabel(90, 0)).toBe("a tu derecha");
    expect(getScreenRelativeDirectionLabel(180, 0)).toBe("detrás de ti");
    expect(getScreenRelativeDirectionLabel(270, 0)).toBe("a tu izquierda");
  });

  it("compensa la rotación de la cámara — mismo caso que ya valida el compás: mirando al este, el norte queda a la izquierda", () => {
    // getCompassRotationDegrees({x:1,z:0}, north) = -90 (CompassIndicator.test.ts).
    // Si la cámara mira al este (-90) y el destino está al norte (0°), en
    // pantalla debe verse a la izquierda.
    expect(getScreenRelativeDirectionLabel(0, -90)).toBe("a tu izquierda");
  });

  it("nunca revienta con ángulos negativos o mayores a 360", () => {
    expect(() => getScreenRelativeDirectionLabel(-450, -720)).not.toThrow();
    expect(SCREEN_RELATIVE_LABELS_SET.has(getScreenRelativeDirectionLabel(-450, -720))).toBe(
      true,
    );
  });
});

const SCREEN_RELATIVE_LABELS_SET = new Set([
  "adelante",
  "adelante y a la derecha",
  "a tu derecha",
  "atrás y a la derecha",
  "detrás de ti",
  "atrás y a la izquierda",
  "a tu izquierda",
  "adelante y a la izquierda",
]);
