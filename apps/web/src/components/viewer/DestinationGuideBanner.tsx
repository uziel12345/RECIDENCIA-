import { memo } from "react";
import type { AmbientBuildingPresence, CompassDestination } from "./CompassIndicator";

function formatDistance(distanceMeters: number): string {
  if (distanceMeters < 1_000) return `${Math.round(distanceMeters)} m`;
  return `${(distanceMeters / 1_000).toFixed(1)} km`;
}

// A partir de "regular" (>15 m reportados, ver LOCATION_ACCURACY_THRESHOLDS_METERS
// en campus-location.config.ts) el punto puede caer fuera del edificio aunque el
// rumbo/distancia sean correctos — típico en computadoras sin GPS real, que
// solo estiman por WiFi/IP. Se avisa en vez de dejar que el usuario asuma una
// precisión que el dispositivo no tiene.
function needsApproximateNotice(quality: CompassDestination["accuracyQuality"]): boolean {
  return quality === "regular" || quality === "poor";
}

/**
 * Guía de destino independiente de la brújula técnica: solo una flecha
 * grande y una frase simple ("a tu derecha") + distancia. Pensada para
 * cualquier usuario, incluso quien no sabe leer una brújula con N/E/S/O —
 * no requiere mirar ni entender ese widget en absoluto.
 */
export const DestinationGuideBanner = memo(function DestinationGuideBanner({
  destination,
  ambientPresence = null,
  isMobile = false,
}: {
  destination: CompassDestination | null;
  ambientPresence?: AmbientBuildingPresence | null;
  isMobile?: boolean;
}) {
  if (destination?.arrived) {
    return (
      <div
        className={`ito-destination-guide${isMobile ? " ito-destination-guide--mobile" : ""}`}
        role="group"
        aria-label={`Has llegado. Te encuentras en ${destination.label}.`}
      >
        <span className="ito-destination-guide__label">Has llegado</span>
        <div className="ito-destination-guide__main">
          <span className="ito-destination-guide__phrase">{destination.label}</span>
        </div>
      </div>
    );
  }

  if (!destination) {
    if (!ambientPresence) return null;
    // Sin destino activo, pero el usuario está dentro/cerca de algún
    // edificio — se avisa de forma discreta, reutilizando la misma tarjeta
    // en vez de abrir un elemento de interfaz nuevo. "near" nunca afirma
    // "estás en": no hay suficiente confianza para eso todavía (ver
    // building-presence-tracker.service.ts).
    const isInside = ambientPresence.status === "inside";
    return (
      <div
        className={`ito-destination-guide${isMobile ? " ito-destination-guide--mobile" : ""}`}
        role="group"
        aria-label={`${isInside ? "Estás en" : "Cerca de"} ${ambientPresence.buildingName}`}
      >
        <span className="ito-destination-guide__label">
          {isInside ? "Ubicación actual" : "Cerca de"}
        </span>
        <div className="ito-destination-guide__main">
          <span className="ito-destination-guide__phrase">{ambientPresence.buildingName}</span>
        </div>
      </div>
    );
  }

  const isApproximate = needsApproximateNotice(destination.accuracyQuality);
  const approximateLabel =
    destination.accuracyMeters !== null
      ? `Ubicación aproximada (±${Math.round(destination.accuracyMeters)} m) — puede que no caigas justo en la puerta`
      : "Ubicación aproximada — puede que no caigas justo en la puerta";

  return (
    <div
      className={`ito-destination-guide${isMobile ? " ito-destination-guide--mobile" : ""}`}
      role="group"
      aria-label={`Ir a ${destination.label}: ${destination.directionLabel}, a ${formatDistance(destination.distanceMeters)}${
        isApproximate ? `. ${approximateLabel}` : ""
      }`}
    >
      <span className="ito-destination-guide__label">{destination.label}</span>
      <div className="ito-destination-guide__main">
        <span
          className="ito-destination-guide__arrow"
          style={{ transform: `rotate(${destination.screenBearingDegrees}deg)` }}
          aria-hidden="true"
        />
        <span className="ito-destination-guide__phrase">{destination.directionLabel}</span>
      </div>
      <span className="ito-destination-guide__distance">
        {formatDistance(destination.distanceMeters)}
      </span>
      {isApproximate && (
        <span className="ito-destination-guide__approx" aria-hidden="true">
          <span className="ito-destination-guide__approx-dot" />
          {approximateLabel}
        </span>
      )}
    </div>
  );
});
