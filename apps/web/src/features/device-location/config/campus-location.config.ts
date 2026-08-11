import type {
  CampusAxisInversion,
  CampusCalibrationPoint,
  CampusLocalCorrectionPoint,
  GeoReferencePoint,
} from "../types/device-location.types";

export const EARTH_RADIUS_METERS = 6_371_000;

export const LOCATION_ACCURACY_THRESHOLDS_METERS = {
  excellent: 5,
  good: 15,
  regular: 35,
} as const;

export const DEVICE_LOCATION_WATCH_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 15_000,
  maximumAge: 1_000,
} as const;

export const LOCATION_FILTER_CONFIG = {
  maximumWalkingSpeedMetersPerSecond: 4,
  maximumAcceptedJumpMeters: 50,
  minimumMovementMeters: 0.5,
} as const;

/**
 * El GPS oscila unos metros aunque el usuario esté parado — recalcular el
 * rumbo con cada lectura produciría un rumbo aleatorio ("adelante" un
 * segundo, "izquierda" al siguiente). Solo se recalcula el rumbo real de
 * desplazamiento (heading-tracker.service.ts) cuando el usuario se movió al
 * menos esta distancia desde la última referencia usada para el cálculo.
 */
export const MIN_MOVEMENT_FOR_HEADING_METERS = 3;

/**
 * Alpha del EMA circular que suaviza el rumbo (ver smoothHeadingDegrees en
 * location-math.ts). Deliberadamente más conservador que
 * LOCATION_SMOOTHING_CONFIG de posición: el rumbo alimenta directamente el
 * texto "adelante/atrás/izquierda/derecha", así que cambiar de golpe se
 * siente más como un error que un salto de un par de metros en el mapa.
 */
export const HEADING_SMOOTHING_ALPHA = 0.35;

/**
 * Promedio móvil exponencial ponderado por precisión (ver
 * location-smoothing.service.ts) — reduce el "movimiento fantasma": el
 * marcador ya no salta a cada lectura ruidosa que pasa el filtro de saltos,
 * sino que se mueve hacia ella proporcionalmente a qué tan confiable es.
 *
 * - referenceAccuracyMeters: precisión (m) a la que una lectura se confía
 *   casi por completo (alpha ≈ maxAlpha). Una lectura con esta precisión o
 *   mejor apenas se suaviza.
 * - minAlpha: piso — incluso una lectura muy imprecisa mueve algo la
 *   posición, para no quedar "pegada" para siempre si la precisión real
 *   del dispositivo es consistentemente mala.
 * - maxAlpha: techo — ni la lectura más precisa reemplaza la posición de
 *   un solo salto; conserva algo de continuidad entre lecturas.
 */
export const LOCATION_SMOOTHING_CONFIG = {
  referenceAccuracyMeters: 8,
  minAlpha: 0.15,
  maxAlpha: 0.9,
} as const;

/**
 * Si hay calibración válida, el punto A será la referencia geográfica.
 * Mientras esté pendiente, el hook usa la primera lectura de cada sesión
 * únicamente para mostrar desplazamientos locales; eso no calibra el modelo.
 */
export const CAMPUS_GEO_REFERENCE: GeoReferencePoint | null = null;

export const CAMPUS_CALIBRATION_POINTS: readonly CampusCalibrationPoint[] = [
  {
    id: "aul-s",
    name: "Edificio S (referencia sureste)",
    geo: {
      // Calibración inicial obtenida del inventario de edificios en producción.
      // Debe verificarse físicamente en el campus antes de declararla definitiva.
      latitude: 17.0762065,
      longitude: -96.7435082,
    },
    map: {
      // Centro geométrico real de Edificio_S dentro de campus.glb.
      x: 1.797831,
      z: 140.173774,
    },
  },
  {
    id: "conacyt",
    name: "CONACYT (referencia noroeste)",
    geo: {
      latitude: 17.0786767,
      longitude: -96.7462076,
    },
    map: {
      // Centro geométrico real de Edificio_Conacyt dentro de campus.glb.
      x: -66.058335,
      z: -123.012427,
    },
  },
  {
    id: "cc-centro",
    name: "Centro de Cómputo (centro del edificio)",
    geo: {
      // Coordenada central registrada para CC en producción.
      latitude: 17.0791234,
      longitude: -96.7443495,
    },
    map: {
      // Centro geométrico real de Centro_computo_Sistemas_Computacionales.
      x: 63.253424,
      z: -81.729201,
    },
  },
];

/**
 * Correcciones de campo localizadas. No alteran la escala/rotación global:
 * compensan deformaciones locales del modelo o de sus referencias históricas
 * y desaparecen suavemente fuera del entorno medido.
 */
export const CAMPUS_LOCAL_CORRECTIONS: readonly CampusLocalCorrectionPoint[] = [
  {
    id: "edificio-i-entrada-principal",
    name: "Edificio I (entrada principal)",
    geo: {
      // Medición física del 2026-08-04; precisión reportada de 3.85 m.
      latitude: 17.0760812,
      longitude: -96.74486,
    },
    map: {
      // Umbral de la puerta identificado en el nodo Edificio_I del GLB.
      x: -86.912,
      z: 110.1097,
    },
    fullEffectRadiusMeters: 8,
    falloffRadiusMeters: 35,
  },
];

/**
 * La inversión se verificó con un tercer punto físico fuera de la línea A-B.
 */
export const CAMPUS_AXIS_INVERSION: CampusAxisInversion = {
  invertEast: false,
  // En el GLB, Z crece hacia el sur; el norte geográfico debe invertirse.
  invertNorth: true,
};

// Valor provisional: verificar contra la escala visual real del GLB.
export const USER_MARKER_HEIGHT = 2;
export const ACCURACY_CIRCLE_HEIGHT = 0.08;
export const MAX_ACCURACY_RADIUS_MODEL_UNITS = 60;
export const MARKER_SMOOTHING_SPEED = 8;

/**
 * Una computadora normalmente no tiene GPS real: estima la ubicación por
 * WiFi/IP, con error de cientos o miles de metros — muy por encima de lo que
 * sirve para señalar un edificio en un campus de ~300 m. Antes el radio del
 * círculo de precisión se recortaba SIEMPRE a 60 unidades sin importar el
 * error real, así que una lectura pésima se veía igual de "confiada" que una
 * excelente. Por encima de este umbral (metros reales del GPS/WiFi, no
 * unidades de mundo) ya no se muestra el punto ni el círculo — es más
 * honesto no mostrar nada que mostrar una ubicación que puede estar a
 * kilómetros de distancia con apariencia precisa.
 */
export const MAX_USEFUL_ACCURACY_METERS = 150;

/**
 * Umbrales de la posición CONFIRMADA (ver position-stability.service.ts) —
 * distintos de MAX_USEFUL_ACCURACY_METERS, que solo decide si algo se
 * muestra o no. Estos deciden si una lectura nueva reemplaza a la última
 * posición confiable, o si se conserva esa última posición tal cual.
 *
 * - minPositionChangeMeters: piso absoluto — con la mejor precisión posible,
 *   igual no vale la pena mover el marcador por menos que esto (ruido normal
 *   del chip GPS incluso parado).
 * - accuracyMovementFactor: además del piso, el desplazamiento debe superar
 *   esta fracción de la precisión reportada de la lectura nueva. Con
 *   accuracy=18 m y un movimiento de 3 m, 3 &lt; 18*0.5=9 — no hay evidencia
 *   suficiente de movimiento real, se conserva la posición anterior (mismo
 *   caso que pide la tarea). Con accuracy=5 m, el umbral efectivo es el piso.
 */
export const POSITION_STABILITY_CONFIG = {
  minPositionChangeMeters: 2.5,
  accuracyMovementFactor: 0.5,
} as const;

export const LOCATION_FEATURE_FLAGS = {
  enableLegacyLocation: false,
  enableDeviceLocationV2: true,
  enableAccuracyCircle: true,
  enableDebugPanel:
    import.meta.env.VITE_ENABLE_LOCATION_DEBUG === "true",
} as const;
