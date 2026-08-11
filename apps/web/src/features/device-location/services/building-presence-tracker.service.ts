import type { ResolvedBuildingLocation } from "../../location/services/location-resolver";

export type BuildingPresenceStatus = "outside" | "near" | "inside";
export type BuildingPresenceConfidence = "high" | "medium" | "low";

export type BuildingPresence = {
  buildingId: string | null;
  buildingName: string | null;
  status: BuildingPresenceStatus;
  confidence: BuildingPresenceConfidence;
};

export type BuildingPresenceTrackerState = {
  confirmed: BuildingPresence;
  pendingCandidate: BuildingPresence | null;
  pendingCount: number;
};

const OUTSIDE_PRESENCE: BuildingPresence = {
  buildingId: null,
  buildingName: null,
  status: "outside",
  confidence: "high",
};

export const INITIAL_BUILDING_PRESENCE_STATE: BuildingPresenceTrackerState = {
  confirmed: OUTSIDE_PRESENCE,
  pendingCandidate: null,
  pendingCount: 0,
};

// Cuántas clasificaciones consecutivas iguales (mismo edificio + mismo
// status) hacen falta para reemplazar lo confirmado — evita que el GPS
// oscilando justo en el borde de un edificio haga parpadear la interfaz
// entre "dentro"/"fuera" varias veces por segundo.
const REQUIRED_CONSISTENT_READINGS = 2;

/**
 * Traduce el resultado de resolveCurrentBuilding (ya calibrado: geocerca
 * primero, luego distancia GPS+modelo ponderada con detección de
 * ambigüedad — ver location-resolver.ts) a un estado de presencia con solo
 * 3 niveles. Deliberadamente NO se reimplementa una detección de "está
 * dentro" por separado: `confidence: "high"` de resolveCurrentBuilding ya
 * exige un acierto geocerca/GPS+modelo sin ambigüedad frente al segundo
 * candidato — una señal más fuerte que "distancia al centro", que es
 * justamente lo que se pidió evitar.
 */
function toPresence(resolved: ResolvedBuildingLocation | null): BuildingPresence {
  if (!resolved) return OUTSIDE_PRESENCE;
  return {
    buildingId: resolved.buildingId,
    buildingName: resolved.buildingName,
    status: resolved.confidence === "high" ? "inside" : "near",
    confidence: resolved.confidence,
  };
}

function isSamePlace(a: BuildingPresence, b: BuildingPresence): boolean {
  return a.buildingId === b.buildingId && a.status === b.status;
}

export type BuildingPresenceUpdateResult = {
  state: BuildingPresenceTrackerState;
  presence: BuildingPresence;
  /** true solo cuando `presence` es distinto de lo que ya se venía mostrando. */
  changed: boolean;
};

/**
 * Aplica histéresis temporal sobre la clasificación de edificio actual: un
 * cambio de edificio o de status (outside/near/inside) solo se confirma tras
 * ver la MISMA clasificación en `REQUIRED_CONSISTENT_READINGS` llamadas
 * seguidas — un único salto aislado no mueve nada. La confianza sí se
 * actualiza de inmediato dentro de la MISMA clasificación confirmada (no
 * necesita esperar consistencia, no afecta la estabilidad del status).
 */
export function updateBuildingPresence(
  resolved: ResolvedBuildingLocation | null,
  state: BuildingPresenceTrackerState,
): BuildingPresenceUpdateResult {
  const candidate = toPresence(resolved);

  if (isSamePlace(candidate, state.confirmed)) {
    const confirmed =
      candidate.confidence === state.confirmed.confidence
        ? state.confirmed
        : { ...state.confirmed, confidence: candidate.confidence };
    return {
      state: { confirmed, pendingCandidate: null, pendingCount: 0 },
      presence: confirmed,
      changed: confirmed !== state.confirmed,
    };
  }

  const matchesPending =
    state.pendingCandidate !== null && isSamePlace(candidate, state.pendingCandidate);
  const pendingCount = matchesPending ? state.pendingCount + 1 : 1;

  if (pendingCount >= REQUIRED_CONSISTENT_READINGS) {
    return {
      state: { confirmed: candidate, pendingCandidate: null, pendingCount: 0 },
      presence: candidate,
      changed: true,
    };
  }

  return {
    state: { confirmed: state.confirmed, pendingCandidate: candidate, pendingCount },
    presence: state.confirmed,
    changed: false,
  };
}
