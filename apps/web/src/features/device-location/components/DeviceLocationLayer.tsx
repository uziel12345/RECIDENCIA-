import {
  LOCATION_FEATURE_FLAGS,
  MAX_ACCURACY_RADIUS_MODEL_UNITS,
  MAX_USEFUL_ACCURACY_METERS,
} from "../config/campus-location.config";
import { metersToModelUnits } from "../services/campus-calibration.service";
import { useDeviceLocationStore } from "../store/device-location.store";
import { DeviceLocationMarker } from "./DeviceLocationMarker";
import { LocationAccuracyCircle } from "./LocationAccuracyCircle";

export function DeviceLocationLayer() {
  const campusPosition = useDeviceLocationStore(
    (state) => state.campusPosition,
  );
  const filteredAccuracy = useDeviceLocationStore(
    (state) => state.filteredPosition?.accuracy ?? null,
  );
  const calibrationScale = useDeviceLocationStore(
    (state) => state.calibrationScale,
  );

  // Sin GPS real (ej. computadora usando WiFi/IP), el error puede ser de
  // cientos o miles de metros — inútil, y engañoso, para señalar un edificio
  // puntual. En vez de dibujar un punto "confiado" en un lugar posiblemente
  // muy lejano, no se muestra nada hasta que la lectura sea razonablemente
  // útil para la escala del campus.
  const isAccuracyUseful =
    filteredAccuracy === null || filteredAccuracy <= MAX_USEFUL_ACCURACY_METERS;

  if (
    !LOCATION_FEATURE_FLAGS.enableDeviceLocationV2 ||
    !campusPosition ||
    !isAccuracyUseful
  ) {
    return null;
  }

  const convertedRadius =
    filteredAccuracy !== null && calibrationScale !== null
      ? metersToModelUnits(filteredAccuracy, calibrationScale)
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
