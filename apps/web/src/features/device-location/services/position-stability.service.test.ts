import { describe, expect, it } from "vitest";
import type { DeviceGeoPosition } from "../types/device-location.types";
import {
  INITIAL_POSITION_STABILITY_STATE,
  updatePositionStability,
  type PositionStabilityState,
} from "./position-stability.service";

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
    timestamp: Date.now(),
  };
}

describe("updatePositionStability", () => {
  it("acepta la primera lectura utilizable como posición confirmada", () => {
    const result = updatePositionStability(
      position(17, -96, 8),
      INITIAL_POSITION_STABILITY_STATE,
    );
    expect(result.updated).toBe(true);
    expect(result.confirmedPosition).not.toBeNull();
  });

  it("no acepta como primera posición una lectura con precisión inservible (Problema 1: no debe empezar mostrando basura)", () => {
    const result = updatePositionStability(
      position(17, -96, 500),
      INITIAL_POSITION_STABILITY_STATE,
    );
    expect(result.updated).toBe(false);
    expect(result.confirmedPosition).toBeNull();
  });

  it("una lectura con precisión inservible NUNCA borra la posición confirmada existente (Problema 1)", () => {
    const first = updatePositionStability(
      position(17, -96, 8),
      INITIAL_POSITION_STABILITY_STATE,
    );
    const bad = updatePositionStability(position(17.01, -96.01, 500), first.state);
    expect(bad.updated).toBe(false);
    expect(bad.confirmedPosition).toBe(first.confirmedPosition);
    expect(bad.confirmedPosition).not.toBeNull();
  });

  it("un desplazamiento diminuto con buena precisión no mueve la posición confirmada (Problema 2: usuario parado)", () => {
    const first = updatePositionStability(
      position(17, -96, 8),
      INITIAL_POSITION_STABILITY_STATE,
    );
    // ~1.1 m de ruido — por debajo del piso mínimo (2.5 m).
    const second = updatePositionStability(position(17.00001, -96, 8), first.state);
    expect(second.updated).toBe(false);
    expect(second.confirmedPosition).toBe(first.confirmedPosition);
  });

  it("con precisión mediocre, un desplazamiento pequeño no basta como evidencia de movimiento real", () => {
    const first = updatePositionStability(
      position(17, -96, 18),
      INITIAL_POSITION_STABILITY_STATE,
    );
    // ~3.3 m — el ejemplo exacto de la tarea: accuracy=18, movimiento=3 no
    // debe bastar (umbral efectivo = max(2.5, 18*0.5=9) = 9 m).
    const second = updatePositionStability(position(17.00003, -96, 18), first.state);
    expect(second.updated).toBe(false);
    expect(second.confirmedPosition).toBe(first.confirmedPosition);
  });

  it("un desplazamiento real y suficiente sí actualiza la posición confirmada", () => {
    const first = updatePositionStability(
      position(17, -96, 8),
      INITIAL_POSITION_STABILITY_STATE,
    );
    // ~11 m — claramente por encima de cualquier umbral razonable con
    // accuracy=8 (piso 2.5, factor 4).
    const second = updatePositionStability(position(17.0001, -96, 8), first.state);
    expect(second.updated).toBe(true);
    expect(second.confirmedPosition).not.toBe(first.confirmedPosition);
    expect(second.confirmedPosition?.latitude).toBeCloseTo(17.0001);
  });

  it("recupera la actualización normal cuando la precisión mejora de nuevo (Prueba 4)", () => {
    const first = updatePositionStability(
      position(17, -96, 8),
      INITIAL_POSITION_STABILITY_STATE,
    );
    const bad = updatePositionStability(position(17, -96, 100), first.state);
    expect(bad.updated).toBe(false);
    const recovered = updatePositionStability(position(17.0001, -96, 10), bad.state);
    expect(recovered.updated).toBe(true);
    expect(recovered.confirmedPosition?.accuracy).toBe(10);
  });

  it("acumula desplazamientos pequeños hasta cruzar el umbral, sin perder la referencia original", () => {
    let state: PositionStabilityState = INITIAL_POSITION_STABILITY_STATE;
    state = updatePositionStability(position(17, -96, 8), state).state;

    const step1 = updatePositionStability(position(17.00001, -96, 8), state);
    expect(step1.updated).toBe(false);
    state = step1.state;

    const step2 = updatePositionStability(position(17.0001, -96, 8), state);
    expect(step2.updated).toBe(true);
  });
});
