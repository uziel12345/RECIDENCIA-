import { describe, expect, it } from "vitest";
import type { DeviceGeoPosition } from "../types/device-location.types";
import {
  INITIAL_HEADING_TRACKER_STATE,
  updateHeadingTracker,
  type HeadingTrackerState,
} from "./heading-tracker.service";

function position(
  latitude: number,
  longitude: number,
  accuracy = 8,
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

describe("updateHeadingTracker", () => {
  it("primera lectura: solo establece la referencia, sin rumbo todavía", () => {
    const result = updateHeadingTracker(
      position(17, -96),
      INITIAL_HEADING_TRACKER_STATE,
    );
    expect(result.updated).toBe(false);
    expect(result.movementHeadingDegrees).toBeNull();
    expect(result.smoothedHeadingDegrees).toBeNull();
    expect(result.state.referencePosition).not.toBeNull();
  });

  it("mantiene el rumbo anterior si el desplazamiento es menor al mínimo (GPS oscilando parado)", () => {
    const first = updateHeadingTracker(
      position(17, -96),
      INITIAL_HEADING_TRACKER_STATE,
    );
    // ~1.1 m de "ruido" — por debajo de MIN_MOVEMENT_FOR_HEADING_METERS (3 m).
    const second = updateHeadingTracker(position(17.00001, -96), first.state);
    expect(second.updated).toBe(false);
    expect(second.smoothedHeadingDegrees).toBeNull();
    // La referencia NO avanza: el próximo tick sigue comparando contra el
    // primer punto, para que el desplazamiento se acumule.
    expect(second.state.referencePosition).toBe(first.state.referencePosition);
  });

  it("calcula rumbo ~0° (norte) tras un desplazamiento suficiente hacia el norte", () => {
    const first = updateHeadingTracker(
      position(17, -96),
      INITIAL_HEADING_TRACKER_STATE,
    );
    // ~11 m hacia el norte — por encima del mínimo.
    const second = updateHeadingTracker(position(17.0001, -96), first.state);
    expect(second.updated).toBe(true);
    expect(second.movementHeadingDegrees ?? NaN).toBeCloseTo(0, 0);
    expect(second.smoothedHeadingDegrees ?? NaN).toBeCloseTo(0, 0);
  });

  it("ignora lecturas con precisión mala en vez de recalcular con ruido", () => {
    const first = updateHeadingTracker(
      position(17, -96),
      INITIAL_HEADING_TRACKER_STATE,
    );
    const withHeading = updateHeadingTracker(position(17.0001, -96), first.state);
    expect(withHeading.updated).toBe(true);

    // Movimiento de sobra, pero con precisión "poor" (> 35 m, el mismo
    // umbral que ya usa getLocationQuality en el resto del sistema).
    const poorAccuracy = updateHeadingTracker(
      position(17.0002, -96, 60),
      withHeading.state,
    );
    expect(poorAccuracy.updated).toBe(false);
    expect(poorAccuracy.smoothedHeadingDegrees).toBe(
      withHeading.smoothedHeadingDegrees,
    );
  });

  it("acumula desplazamientos pequeños hasta cruzar el umbral, en vez de perderlos", () => {
    let state: HeadingTrackerState = INITIAL_HEADING_TRACKER_STATE;
    state = updateHeadingTracker(position(17, -96), state).state;

    // Un paso de ~1.1 m (insuficiente solo)...
    const step1 = updateHeadingTracker(position(17.00001, -96), state);
    expect(step1.updated).toBe(false);
    state = step1.state;

    // ...seguido de un desplazamiento que sí supera el mínimo desde la
    // MISMA referencia original (nunca se perdió el punto de partida).
    const step2 = updateHeadingTracker(position(17.0001, -96), state);
    expect(step2.updated).toBe(true);
    expect(step2.movementHeadingDegrees ?? NaN).toBeCloseTo(0, 0);
  });

  it("suaviza progresivamente: un cambio real de rumbo no se refleja de golpe", () => {
    let state: HeadingTrackerState = INITIAL_HEADING_TRACKER_STATE;
    state = updateHeadingTracker(position(17, -96), state).state;

    // Primer tramo hacia el norte (heading ~0°).
    const north = updateHeadingTracker(position(17.0001, -96), state);
    state = north.state;

    // Segundo tramo hacia el este (heading ~90°) — el rumbo suavizado debe
    // quedar ENTRE el anterior y el nuevo, no saltar directo a 90°.
    const east = updateHeadingTracker(position(17.0001, -95.9999), state);
    expect(east.updated).toBe(true);
    expect(east.movementHeadingDegrees ?? NaN).toBeCloseTo(90, 0);
    expect(east.smoothedHeadingDegrees ?? NaN).toBeGreaterThan(0);
    expect(east.smoothedHeadingDegrees ?? NaN).toBeLessThan(90);
  });
});
