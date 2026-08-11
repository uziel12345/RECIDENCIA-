import { describe, expect, it } from "vitest";
import {
  getCompassBearingDegrees,
  getDestinationBearing,
  getScreenRelativeBearing,
  getScreenRelativeDirectionLabel,
  getUserRelativeBearing,
  getUserRelativeDirectionLabel,
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

describe("getUserRelativeBearing", () => {
  it("con el rumbo del usuario igual al del destino, da 0° (adelante)", () => {
    expect(getUserRelativeBearing(0, 0)).toBeCloseTo(0);
    expect(getUserRelativeBearing(90, 90)).toBeCloseTo(0);
  });

  it("el destino a la derecha del rumbo del usuario da 90°", () => {
    expect(getUserRelativeBearing(90, 0)).toBeCloseTo(90);
  });

  it("el destino detrás del usuario da 180°, sin importar el rumbo absoluto", () => {
    expect(getUserRelativeBearing(180, 0)).toBeCloseTo(180);
    expect(getUserRelativeBearing(0, 180)).toBeCloseTo(180);
  });

  it("NO recibe ningún parámetro de cámara/rotación de mapa — solo rumbos", () => {
    expect(getUserRelativeBearing.length).toBe(2);
  });

  it("envuelve correctamente a [0,360) con ángulos extremos", () => {
    const result = getUserRelativeBearing(-450, 720);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(360);
  });
});

describe("getUserRelativeDirectionLabel — independiente de la rotación de cámara/mapa", () => {
  it("usuario caminando hacia el norte con el destino al norte: adelante", () => {
    expect(getUserRelativeDirectionLabel(0, 0)).toBe("adelante");
  });

  it("rotar el mapa 180° NO cambia la indicación mientras el usuario siga caminando igual", () => {
    // Este es exactamente el escenario reportado como bug: destino al norte
    // (bearing=0), usuario caminando al norte (heading=0) → "adelante". El
    // usuario rota el mapa/cámara 180° con el dedo — pero getUserRelative*
    // no recibe ese dato en absoluto, así que el resultado es idéntico.
    const beforeRotating = getUserRelativeDirectionLabel(0, 0);
    const afterRotatingMap180 = getUserRelativeDirectionLabel(0, 0); // compassRotation ni se pasa
    expect(afterRotatingMap180).toBe(beforeRotating);
    expect(afterRotatingMap180).toBe("adelante");
  });

  it("si el usuario físicamente se da vuelta y camina hacia el sur, sí cambia a 'detrás de ti'", () => {
    // El destino sigue al norte (bearing=0°), pero ahora heading≈180°
    // (el usuario gira su cuerpo, no el mapa) — el sistema SÍ debe
    // reconocer el cambio real de dirección.
    expect(getUserRelativeDirectionLabel(0, 180)).toBe("detrás de ti");
  });

  it("destino a la derecha del rumbo real: 'a tu derecha'", () => {
    expect(getUserRelativeDirectionLabel(90, 0)).toBe("a tu derecha");
  });

  it("destino a la izquierda del rumbo real: 'a tu izquierda'", () => {
    expect(getUserRelativeDirectionLabel(270, 0)).toBe("a tu izquierda");
  });

  it("nunca revienta con ángulos negativos o mayores a 360", () => {
    expect(() => getUserRelativeDirectionLabel(-450, 720)).not.toThrow();
    expect(
      SCREEN_RELATIVE_LABELS_SET.has(getUserRelativeDirectionLabel(-450, 720)),
    ).toBe(true);
  });
});
