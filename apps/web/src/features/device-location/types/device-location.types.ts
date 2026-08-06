export type DeviceLocationStatus =
  | "idle"
  | "requesting-permission"
  | "ready"
  | "tracking"
  | "permission-denied"
  | "unsupported"
  | "error";

export type DeviceLocationPermission =
  | "unknown"
  | "prompt"
  | "granted"
  | "denied";

export type DeviceGeoPosition = {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
};

export type GeoReferencePoint = {
  latitude: number;
  longitude: number;
};

export type LocalMetricPosition = {
  eastMeters: number;
  northMeters: number;
};

export type CampusMapPosition = {
  x: number;
  y: number;
  z: number;
};

export type LocationQuality = "excellent" | "good" | "regular" | "poor";

export type CampusCalibrationPoint = {
  id: string;
  name: string;
  geo: GeoReferencePoint;
  map: {
    x: number;
    z: number;
  };
  /**
   * Peso relativo para el ajuste multipunto. Una medición de campo precisa
   * puede tener más influencia que una coordenada tomada del inventario.
   */
  weight?: number;
};

export type CampusLocalCorrectionPoint = {
  id: string;
  name: string;
  geo: GeoReferencePoint;
  map: {
    x: number;
    z: number;
  };
  fullEffectRadiusMeters: number;
  falloffRadiusMeters: number;
};

export type CampusAxisInversion = {
  invertEast: boolean;
  invertNorth: boolean;
};

export type CampusCalibrationTransform = {
  reference: GeoReferencePoint;
  mapOrigin: {
    x: number;
    z: number;
  };
  scaleModelUnitsPerMeter: number;
  rotationRadians: number;
  axisInversion: CampusAxisInversion;
};

export type CampusCalibrationResult = {
  status: "valid" | "pending" | "invalid";
  message: string;
  transform: CampusCalibrationTransform | null;
  geoDistanceMeters: number | null;
  mapDistanceModelUnits: number | null;
};

export type LocationFilterReason =
  | "first-reading"
  | "accepted"
  | "small-movement"
  | "impossible-jump"
  | "invalid-reading";

export type LocationFilterResult = {
  accepted: boolean;
  position: DeviceGeoPosition | null;
  distanceMeters: number | null;
  elapsedSeconds: number | null;
  estimatedSpeedMetersPerSecond: number | null;
  reason: LocationFilterReason;
};
