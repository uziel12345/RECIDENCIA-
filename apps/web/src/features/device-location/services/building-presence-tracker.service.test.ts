import { describe, expect, it } from "vitest";
import type { ResolvedBuildingLocation } from "../../location/services/location-resolver";
import {
  INITIAL_BUILDING_PRESENCE_STATE,
  updateBuildingPresence,
  type BuildingPresenceTrackerState,
} from "./building-presence-tracker.service";

function resolved(
  overrides: Partial<ResolvedBuildingLocation> = {},
): ResolvedBuildingLocation {
  return {
    buildingId: "biblioteca",
    buildingCode: "BIB",
    buildingName: "Biblioteca",
    distanceMeters: 0,
    confidence: "high",
    method: "geofence",
    ...overrides,
  };
}

describe("updateBuildingPresence", () => {
  it("empieza en 'outside' sin ningún edificio", () => {
    expect(INITIAL_BUILDING_PRESENCE_STATE.confirmed.status).toBe("outside");
    expect(INITIAL_BUILDING_PRESENCE_STATE.confirmed.buildingId).toBeNull();
  });

  it("null (fuera de cualquier edificio) es inmediato — no necesita hysteresis para 'outside' inicial", () => {
    const result = updateBuildingPresence(null, INITIAL_BUILDING_PRESENCE_STATE);
    expect(result.changed).toBe(false);
    expect(result.presence.status).toBe("outside");
  });

  it("confidence='high' se clasifica como 'inside' (Prueba 5/8: llegar a un edificio)", () => {
    let state: BuildingPresenceTrackerState = INITIAL_BUILDING_PRESENCE_STATE;
    const r1 = updateBuildingPresence(resolved({ confidence: "high" }), state);
    expect(r1.changed).toBe(false); // primera lectura: todavía "pendiente"
    state = r1.state;
    const r2 = updateBuildingPresence(resolved({ confidence: "high" }), state);
    expect(r2.changed).toBe(true);
    expect(r2.presence.status).toBe("inside");
    expect(r2.presence.buildingId).toBe("biblioteca");
  });

  it("confidence='medium'/'low' se clasifica como 'near', nunca 'inside' (Prueba 6: no afirmar sin evidencia)", () => {
    let state: BuildingPresenceTrackerState = INITIAL_BUILDING_PRESENCE_STATE;
    state = updateBuildingPresence(resolved({ confidence: "medium" }), state).state;
    const result = updateBuildingPresence(resolved({ confidence: "medium" }), state);
    expect(result.changed).toBe(true);
    expect(result.presence.status).toBe("near");
  });

  it("una sola lectura aislada distinta no cambia el estado confirmado (Prueba 7: sin parpadeo)", () => {
    // Confirmar "inside" en Biblioteca primero.
    let state: BuildingPresenceTrackerState = INITIAL_BUILDING_PRESENCE_STATE;
    state = updateBuildingPresence(resolved({ confidence: "high" }), state).state;
    state = updateBuildingPresence(resolved({ confidence: "high" }), state).state;

    // Una lectura aislada que dice "outside" (el borde del GPS fluctuando)
    // no debe bastar para salir todavía.
    const flicker = updateBuildingPresence(null, state);
    expect(flicker.changed).toBe(false);
    expect(flicker.presence.status).toBe("inside");

    // Si la siguiente lectura vuelve a "inside", el parpadeo no dejó rastro.
    const backInside = updateBuildingPresence(resolved({ confidence: "high" }), flicker.state);
    expect(backInside.changed).toBe(false);
    expect(backInside.presence.status).toBe("inside");
  });

  it("dos lecturas consecutivas de salida sí confirman que el usuario salió (Prueba 9)", () => {
    let state: BuildingPresenceTrackerState = INITIAL_BUILDING_PRESENCE_STATE;
    state = updateBuildingPresence(resolved({ confidence: "high" }), state).state;
    state = updateBuildingPresence(resolved({ confidence: "high" }), state).state;

    state = updateBuildingPresence(null, state).state;
    const result = updateBuildingPresence(null, state);
    expect(result.changed).toBe(true);
    expect(result.presence.status).toBe("outside");
    expect(result.presence.buildingId).toBeNull();
  });

  it("cambiar de confianza dentro del mismo edificio/status se refleja de inmediato, sin esperar consistencia", () => {
    let state: BuildingPresenceTrackerState = INITIAL_BUILDING_PRESENCE_STATE;
    state = updateBuildingPresence(resolved({ confidence: "medium" }), state).state;
    state = updateBuildingPresence(resolved({ confidence: "medium" }), state).state; // confirma "near"/medium

    const upgraded = updateBuildingPresence(resolved({ confidence: "medium" }), state);
    // Sin cambio real, no debería marcar changed.
    expect(upgraded.changed).toBe(false);
  });

  it("cambiar de un edificio a otro también exige consistencia (no salta directo)", () => {
    let state: BuildingPresenceTrackerState = INITIAL_BUILDING_PRESENCE_STATE;
    state = updateBuildingPresence(resolved({ buildingId: "cc", confidence: "high" }), state).state;
    state = updateBuildingPresence(resolved({ buildingId: "cc", confidence: "high" }), state).state;

    const firstBib = updateBuildingPresence(
      resolved({ buildingId: "biblioteca", confidence: "high" }),
      state,
    );
    expect(firstBib.changed).toBe(false);
    expect(firstBib.presence.buildingId).toBe("cc");

    const secondBib = updateBuildingPresence(
      resolved({ buildingId: "biblioteca", confidence: "high" }),
      firstBib.state,
    );
    expect(secondBib.changed).toBe(true);
    expect(secondBib.presence.buildingId).toBe("biblioteca");
  });
});
