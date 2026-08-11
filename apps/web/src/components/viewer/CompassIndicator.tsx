import { memo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import type { LocationQuality } from "../../features/device-location";
import { getCompassRotationDegrees } from "./compass-orientation";
import { DestinationGuideBanner } from "./DestinationGuideBanner";

export function CompassCameraSync({
  onRotationChange,
}: {
  onRotationChange: (degrees: number) => void;
}) {
  const { camera } = useThree();
  const direction = useRef(new Vector3());
  const previous = useRef(Number.NaN);

  useFrame(() => {
    camera.getWorldDirection(direction.current);
    const next = getCompassRotationDegrees(direction.current);
    if (!Number.isFinite(previous.current) || Math.abs(next - previous.current) >= 0.5) {
      previous.current = next;
      onRotationChange(next);
    }
  });
  return null;
}

export type CompassDestination = {
  bearingDegrees: number;
  // Rumbo ya compuesto, listo para rotar la flecha de DestinationGuideBanner
  // (fuera de la brújula, así que no puede apoyarse en el truco de rotación
  // anidada que sí usa la flecha interna de la brújula con `bearingDegrees`).
  // Relativo al rumbo REAL de desplazamiento del usuario (GPS) cuando ya se
  // conoce; si todavía no existe (recién llegó, aún sin desplazamiento
  // suficiente), cae de vuelta a ser relativo a la cámara — ver
  // CampusViewer.compassDestination para la composición exacta.
  screenBearingDegrees: number;
  distanceMeters: number;
  // Frase simple ("a tu derecha") en vez de puntos cardinales — relativa al
  // mismo rumbo que screenBearingDegrees (real del usuario cuando existe,
  // cámara como respaldo si no). No requiere saber qué es "noreste".
  directionLabel: string;
  label: string;
  // Precisión reportada del GPS/WiFi en el momento del cálculo — `null`
  // cuando no hay lectura de precisión disponible (ej. sistema legado).
  // DestinationGuideBanner la usa para avisar cuando la posición es solo
  // aproximada, en vez de dejar que el usuario asuma una precisión que el
  // dispositivo no tiene (típico en computadoras sin GPS real).
  accuracyMeters: number | null;
  accuracyQuality: LocationQuality | null;
};

export const CompassIndicator = memo(function CompassIndicator({
  rotationDegrees,
  isMobile = false,
  destination = null,
}: {
  rotationDegrees: number;
  isMobile?: boolean;
  destination?: CompassDestination | null;
}) {
  return (
    <div
      className={`ito-compass${isMobile ? " ito-compass--mobile" : ""}`}
      aria-label="Brújula del mapa: norte, sur, este y oeste"
      role="img"
    >
      <div
        className="ito-compass__rose"
        style={{ transform: `rotate(${rotationDegrees}deg)` }}
      >
        <span className="ito-compass__direction ito-compass__direction--north">N</span>
        <span className="ito-compass__direction ito-compass__direction--east">E</span>
        <span className="ito-compass__direction ito-compass__direction--south">S</span>
        <span className="ito-compass__direction ito-compass__direction--west">O</span>
        <span className="ito-compass__needle" aria-hidden="true" />
        {destination && (
          // Anidada dentro de la rosa que ya rota para compensar la cámara:
          // solo se le suma la rotación del rumbo al destino, así el
          // resultado en pantalla es la suma correcta de ambas sin tener
          // que resolver esa composición a mano.
          <span
            className="ito-compass__destination-arrow"
            style={{ transform: `rotate(${destination.bearingDegrees}deg)` }}
            aria-hidden="true"
          />
        )}
      </div>
      {/* Anclada al propio contenedor de la brújula (no al viewport): así
          hereda automáticamente su posición correcta en cada variante de
          página (escritorio, móvil, modo de mapa completo con sidebar
          flotante...) sin tener que duplicar esa lógica de posicionamiento
          aquí. Sigue siendo una guía visualmente aparte de la rosa N/E/S/O,
          solo comparte el mismo "punto de anclaje" en pantalla. */}
      <DestinationGuideBanner destination={destination} isMobile={isMobile} />
    </div>
  );
});
