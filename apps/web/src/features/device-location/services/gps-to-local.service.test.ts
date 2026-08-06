import { describe, expect, it } from "vitest";
import { gpsToLocalMeters } from "./gps-to-local.service";

describe("gpsToLocalMeters", () => {
  const reference = { latitude: 17, longitude: -96 };

  it("expresa el desplazamiento norte y este en metros", () => {
    const north = gpsToLocalMeters(
      { latitude: 17.001, longitude: -96 },
      reference,
    );
    const east = gpsToLocalMeters(
      { latitude: 17, longitude: -95.999 },
      reference,
    );

    expect(north?.northMeters).toBeCloseTo(111.19, 1);
    expect(north?.eastMeters).toBeCloseTo(0, 8);
    expect(east?.eastMeters).toBeCloseTo(106.35, 1);
    expect(east?.northMeters).toBeCloseTo(0, 8);
  });

  it("devuelve cero cuando posición y referencia coinciden", () => {
    expect(gpsToLocalMeters(reference, reference)).toEqual({
      northMeters: 0,
      eastMeters: 0,
    });
  });

  it("rechaza entradas inválidas sin producir NaN", () => {
    expect(
      gpsToLocalMeters(
        { latitude: Number.POSITIVE_INFINITY, longitude: -96 },
        reference,
      ),
    ).toBeNull();
  });
});
