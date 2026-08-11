import {
  LOCATION_FEATURE_FLAGS,
  MAX_ACCURACY_RADIUS_MODEL_UNITS,
} from "../config/campus-location.config";
import { metersToModelUnits } from "../services/campus-calibration.service";
import { useDeviceLocationStore } from "../store/device-location.store";
import { DeviceLocationMarker } from "./DeviceLocationMarker";
import { LocationAccuracyCircle } from "./LocationAccuracyCircle";

export function DeviceLocationLayer() {
  const campusPosition = useDeviceLocationStore(
    (state) => state.campusPosition,
  );
  // Precisión de la posición CONFIRMADA (no de la última lectura cruda): el
  // filtro de "¿es esto lo bastante bueno para mostrarse?" ya se aplicó UNA
  // vez, en position-stability.service.ts, al decidir campusPosition. Volver
  // a filtrar aquí contra la lectura más reciente era exactamente lo que
  // hacía desaparecer el marcador ante una sola lectura mala aislada, aunque
  // campusPosition siguiera siendo una posición perfectamente confiable.
  const confirmedAccuracy = useDeviceLocationStore(
    (state) => state.confirmedPosition?.accuracy ?? null,
  );
  const calibrationScale = useDeviceLocationStore(
    (state) => state.calibrationScale,
  );

  if (!LOCATION_FEATURE_FLAGS.enableDeviceLocationV2 || !campusPosition) {
    return null;
  }

  const convertedRadius =
    confirmedAccuracy !== null && calibrationScale !== null
      ? metersToModelUnits(confirmedAccuracy, calibrationScale)
      : null;
  const visibleRadius = convertedRadius === null
    ? null
    : Math.min(convertedRadius, MAX_ACCURACY_RADIUS_MODEL_UNITS);

  return (
    <>
      {LOCATION_FEATURE_FLAGS.enableAccuracyCircle && visibleRadius !== null && (
        <LocationAccuracyCircle
          position={campusPosition}
          radiusModelUnits={visibleRadius}
        />
      )}
      <DeviceLocationMarker position={campusPosition} />
    </>
  );
}
