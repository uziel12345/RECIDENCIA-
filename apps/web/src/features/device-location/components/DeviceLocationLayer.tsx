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
  const filteredAccuracy = useDeviceLocationStore(
    (state) => state.filteredPosition?.accuracy ?? null,
  );
  const calibrationScale = useDeviceLocationStore(
    (state) => state.calibrationScale,
  );

  if (!LOCATION_FEATURE_FLAGS.enableDeviceLocationV2 || !campusPosition) {
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
