import { MAP_ORIENTATION } from "./map-orientation.config";

export type LocalPoint2D = { x: number; z: number };

/**
 * Rumbo de brújula (0-360°, sentido horario: N=0, E=90, S=180, O=270) de un
 * vector en el espacio LOCAL del campus (el mismo que usan building.x/z y
 * la posición calibrada del usuario — no el espacio "mundo" tras la
 * rotación del grupo del visor).
 *
 * Fórmula validada contra el norte/este locales ya confirmados por
 * CompassIndicator.test.ts ({x:0,z:-1}=norte, {x:1,z:0}=este): con esos dos
 * vectores como referencia, atan2(x, -z) da exactamente 0° y 90°.
 */
export function getCompassBearingDegrees(direction: LocalPoint2D): number {
  const bearing = (Math.atan2(direction.x, -direction.z) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

/**
 * Rumbo y distancia (en unidades de modelo) desde `from` hacia `to`, ambos
 * en el espacio local del campus. `null` si los puntos son prácticamente
 * el mismo (no hay una dirección significativa que calcular).
 */
export function getDestinationBearing(
  from: LocalPoint2D,
  to: LocalPoint2D,
): { bearingDegrees: number; distanceModelUnits: number } | null {
  const direction = { x: to.x - from.x, z: to.z - from.z };
  const distanceModelUnits = Math.hypot(direction.x, direction.z);
  if (!Number.isFinite(distanceModelUnits) || distanceModelUnits < 0.01) {
    return null;
  }
  return {
    bearingDegrees: getCompassBearingDegrees(direction),
    distanceModelUnits,
  };
}

/** Referencia de norte local, reexportada para quien solo necesite el vector. */
export const LOCAL_NORTH: LocalPoint2D = MAP_ORIENTATION.geographicNorthLocal;

const SCREEN_RELATIVE_LABELS = [
  "adelante",
  "adelante y a la derecha",
  "a tu derecha",
  "atrás y a la derecha",
  "detrás de ti",
  "atrás y a la izquierda",
  "a tu izquierda",
  "adelante y a la izquierda",
] as const;

/**
 * Traduce un rumbo YA relativo (0°=adelante, 90°=derecha, 180°=atrás,
 * 270°=izquierda — sin importar de qué se compuso) a una de las 8 frases.
 * Compartida por las dos familias de funciones de este archivo: la relativa
 * a cámara (getScreenRelative*, de toda la vida) y la relativa al rumbo real
 * del usuario (getUserRelative*, más abajo) — ambas terminan resolviendo el
 * mismo tipo de ángulo, solo cambia con qué se compone antes de llegar aquí.
 */
function describeRelativeBearing(relativeBearingDegrees: number): string {
  const normalized = ((relativeBearingDegrees % 360) + 360) % 360;
  const sector = Math.round(normalized / 45) % 8;
  return SCREEN_RELATIVE_LABELS[sector];
}

/**
 * Rumbo al destino compuesto con la rotación de la cámara: dónde aparece el
 * destino EN PANTALLA ahora mismo (0°=arriba/lejos de ti en la vista,
 * 90°=derecha, 180°=abajo/hacia ti, 270°=izquierda). Es la misma composición
 * que ya usa la rosa de la brújula (ver CompassIndicator) para su propia
 * flecha anidada, pero aquí resuelta a un solo número — útil para cualquier
 * elemento que NO esté anidado dentro de un contenedor que ya rota (p. ej.
 * una flecha de guía independiente, fuera del widget de la brújula).
 */
export function getScreenRelativeBearing(
  bearingDegrees: number,
  cameraRotationDegrees: number,
): number {
  return (bearingDegrees + cameraRotationDegrees + 360 * 100) % 360;
}

/**
 * Traduce el rumbo al destino a una frase simple ("a tu derecha", "detrás
 * de ti"...) relativa a CÓMO SE VE EL MAPA AHORA MISMO — no a hacia dónde
 * apunta tu cuerpo real (eso requeriría el sensor de orientación del
 * teléfono, con permisos y ruido de magnetómetro adicionales). Es la misma
 * idea que un mapa 2D con "norte arriba": describe el mapa que tienes
 * enfrente, no un GPS de tu cuerpo — sigue siendo honesto, solo que en
 * lenguaje simple en vez de puntos cardinales que exigen saber geografía.
 * Pensado para usuarios que ni siquiera entienden una brújula: no requiere
 * saber qué es "noreste", solo "derecha" o "izquierda".
 */
export function getScreenRelativeDirectionLabel(
  bearingDegrees: number,
  cameraRotationDegrees: number,
): string {
  return describeRelativeBearing(
    getScreenRelativeBearing(bearingDegrees, cameraRotationDegrees),
  );
}

/**
 * Rumbo al destino relativo a la dirección REAL en la que camina el usuario
 * (userHeadingDegrees, derivado de posiciones GPS consecutivas — ver
 * heading-tracker.service.ts), NO a la cámara ni al mapa. Girar el mapa con
 * el dedo o el mouse no cambia este número; solo caminar físicamente en otra
 * dirección lo hace. 0°=el destino queda en la dirección en que caminas
 * (adelante), 90°=a tu derecha, 180°=detrás de ti, 270°=a tu izquierda.
 */
export function getUserRelativeBearing(
  destinationBearingDegrees: number,
  userHeadingDegrees: number,
): number {
  return (
    ((destinationBearingDegrees - userHeadingDegrees) % 360 + 360) % 360
  );
}

/** Misma idea que getScreenRelativeDirectionLabel, pero relativa al rumbo real del usuario en vez de a la cámara. */
export function getUserRelativeDirectionLabel(
  destinationBearingDegrees: number,
  userHeadingDegrees: number,
): string {
  return describeRelativeBearing(
    getUserRelativeBearing(destinationBearingDegrees, userHeadingDegrees),
  );
}
