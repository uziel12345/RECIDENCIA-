import { useEffect, useRef, useState } from "react";
import { getBuildingGeofencesApi, type BuildingGeofence } from "@ito-map/shared";
import type { Building } from "../../buildings/types/building";
import { resolveCurrentBuilding } from "../../location/services/location-resolver";
import {
  INITIAL_BUILDING_PRESENCE_STATE,
  updateBuildingPresence,
  type BuildingPresence,
  type BuildingPresenceTrackerState,
} from "../services/building-presence-tracker.service";
import { useDeviceLocationStore } from "../store/device-location.store";

/**
 * Determina si el usuario está fuera, cerca o dentro de algún edificio del
 * campus, con estabilidad temporal (ver building-presence-tracker.service).
 * Reutiliza resolveCurrentBuilding (geocercas + distancia GPS/modelo
 * calibrada, ya usado por el sistema legado) en vez de reimplementar
 * detección de geometría — solo agrega la traducción a
 * outside/near/inside y la histéresis para que no parpadee.
 *
 * Se recalcula únicamente cuando cambia la posición CONFIRMADA (nunca la
 * lectura cruda), así que hereda automáticamente toda la estabilidad de
 * position-stability.service.ts: una lectura mala aislada no puede sacar al
 * usuario del edificio en el que ya se sabía que estaba.
 */
export function useBuildingPresence(buildings: Building[]): BuildingPresence {
  const confirmedPosition = useDeviceLocationStore(
    (state) => state.confirmedPosition,
  );
  const campusPosition = useDeviceLocationStore((state) => state.campusPosition);
  const [geofences, setGeofences] = useState<BuildingGeofence[]>([]);
  const trackerRef = useRef<BuildingPresenceTrackerState>(
    INITIAL_BUILDING_PRESENCE_STATE,
  );
  const [presence, setPresence] = useState<BuildingPresence>(
    INITIAL_BUILDING_PRESENCE_STATE.confirmed,
  );

  useEffect(() => {
    let cancelled = false;
    getBuildingGeofencesApi()
      .then((items) => {
        if (!cancelled) setGeofences(items);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Sin posición confirmada todavía no hay nada que resolver — el estado
    // inicial ya es "outside" y no hace falta forzarlo de nuevo aquí.
    if (!confirmedPosition || !campusPosition) return;

    const resolved = resolveCurrentBuilding(
      buildings,
      {
        latitude: confirmedPosition.latitude,
        longitude: confirmedPosition.longitude,
        accuracy: confirmedPosition.accuracy,
      },
      campusPosition,
      geofences,
    );

    const result = updateBuildingPresence(resolved, trackerRef.current);
    trackerRef.current = result.state;
    if (result.changed) {
      setPresence(result.presence);
    }
  }, [confirmedPosition, campusPosition, buildings, geofences]);

  return presence;
}
