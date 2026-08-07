import { memo } from "react";
import type { CompassDestination } from "./CompassIndicator";

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
  isMobile = false,
}: {
  destination: CompassDestination | null;
  isMobile?: boolean;
}) {
  if (!destination) return null;

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
