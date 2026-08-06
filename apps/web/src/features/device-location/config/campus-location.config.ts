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

export const LOCATION_FEATURE_FLAGS = {
  enableLegacyLocation: false,
  enableDeviceLocationV2: true,
  enableAccuracyCircle: true,
  enableDebugPanel:
    import.meta.env.VITE_ENABLE_LOCATION_DEBUG === "true",
} as const;
