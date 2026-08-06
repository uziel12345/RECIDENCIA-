import { describe, expect, it } from "vitest";
import {
  CAMPUS_AXIS_INVERSION,
  CAMPUS_CALIBRATION_POINTS,
} from "../config/campus-location.config";
import type {
  CampusCalibrationPoint,
  CampusCalibrationTransform,
} from "../types/device-location.types";
import {
  calculateCalibrationTransform,
  gpsToCampusPosition,
  gpsToLocallyCorrectedCampusPosition,
  localMetersToCampusPosition,
  metersToModelUnits,
} from "./campus-calibration.service";

const POINT_A: CampusCalibrationPoint = {
  id: "a",
  name: "A",
  geo: { latitude: 17, longitude: -96 },
  map: { x: 10, z: 20 },
};

const POINT_B: CampusCalibrationPoint = {
  id: "b",
  name: "B",
  geo: { latitude: 17, longitude: -95.999 },
  map: { x: 10, z: 120 },
};

describe("campus-calibration.service", () => {
  it("calcula distancia, escala y ángulo entre dos puntos", () => {
    const result = calculateCalibrationTransform([POINT_A, POINT_B]);

    expect(result.status).toBe("valid");
    expect(result.geoDistanceMeters).toBeCloseTo(106.35, 1);
    expect(result.mapDistanceModelUnits).toBeCloseTo(100, 8);
    expect(result.transform?.scaleModelUnitsPerMeter).toBeCloseTo(
      100 / 106.35,
      3,
    );
    expect(result.transform?.rotationRadians).toBeCloseTo(Math.PI / 2, 8);
  });

  it("transforma metros locales a X/Z del modelo", () => {
    const result = calculateCalibrationTransform([POINT_A, POINT_B]);
    const transform = result.transform;
    expect(transform).not.toBeNull();
    if (!transform || result.geoDistanceMeters === null) return;

    const campus = localMetersToCampusPosition(
      { eastMeters: result.geoDistanceMeters, northMeters: 0 },
      transform,
    );
    expect(campus?.x).toBeCloseTo(POINT_B.map.x, 7);
    expect(campus?.z).toBeCloseTo(POINT_B.map.z, 7);
  });

  it("convierte directamente una coordenada GPS al modelo", () => {
    const transform = calculateCalibrationTransform([POINT_A, POINT_B]).transform;
    expect(transform).not.toBeNull();
    if (!transform) return;

    const campus = gpsToCampusPosition(POINT_B.geo, transform);
    expect(campus?.x).toBeCloseTo(POINT_B.map.x, 7);
    expect(campus?.z).toBeCloseTo(POINT_B.map.z, 7);
  });

  it("convierte metros a unidades del modelo", () => {
    expect(metersToModelUnits(12, 1.5)).toBe(18);
    expect(metersToModelUnits(-1, 1.5)).toBeNull();
  });

  it("mantiene válida la calibración inicial del campus", () => {
    const result = calculateCalibrationTransform(
      CAMPUS_CALIBRATION_POINTS,
      CAMPUS_AXIS_INVERSION,
    );
    expect(result.status).toBe("valid");
    expect(result.message).toBe("Calibración ponderada de 3 puntos válida.");
    expect(result.transform?.axisInversion.invertNorth).toBe(true);
    expect(result.transform?.scaleModelUnitsPerMeter).toBeCloseTo(0.6819, 3);

    const entrance = CAMPUS_CALIBRATION_POINTS[2];
    expect(entrance).toBeDefined();
    if (!result.transform || !entrance) return;
    const campus = gpsToCampusPosition(entrance.geo, result.transform);
    expect(campus).not.toBeNull();
    if (!campus) return;
    const residualMeters =
      Math.hypot(campus.x - entrance.map.x, campus.z - entrance.map.z) /
      result.transform.scaleModelUnitsPerMeter;
    expect(residualMeters).toBeLessThan(5);
  });

  it("coloca la lectura física de la entrada dentro de Centro de Cómputo", () => {
    const result = calculateCalibrationTransform(
      CAMPUS_CALIBRATION_POINTS,
      CAMPUS_AXIS_INVERSION,
    );
    expect(result.transform).not.toBeNull();
    if (!result.transform) return;

    const entrance = gpsToCampusPosition(
      { latitude: 17.0789672, longitude: -96.7443598 },
      result.transform,
    );
    expect(entrance?.x).toBeCloseTo(58.18, 1);
    expect(entrance?.z).toBeCloseTo(-71.5, 1);

    // Límites X/Z del nodo Centro_computo_Sistemas_Computacionales en el GLB.
    expect(entrance?.x).toBeGreaterThanOrEqual(46.88);
    expect(entrance?.x).toBeLessThanOrEqual(79.63);
    expect(entrance?.z).toBeGreaterThanOrEqual(-98.11);
    expect(entrance?.z).toBeLessThanOrEqual(-65.35);
  });

  it("corrige localmente la entrada de Edificio I sin mover puntos lejanos", () => {
    const result = calculateCalibrationTransform(
      CAMPUS_CALIBRATION_POINTS,
      CAMPUS_AXIS_INVERSION,
    );
    expect(result.transform).not.toBeNull();
    if (!result.transform) return;

    const buildingIEntrance = {
      latitude: 17.0760812,
      longitude: -96.74486,
    };
    const corrected = gpsToLocallyCorrectedCampusPosition(
      buildingIEntrance,
      result.transform,
    );
    expect(corrected?.x).toBeCloseTo(-86.912, 4);
    expect(corrected?.z).toBeCloseTo(110.1097, 4);

    const cafeteriaEntrance = {
      latitude: 17.0772849,
      longitude: -96.7441639,
    };
    const baseCafeteria = gpsToCampusPosition(
      cafeteriaEntrance,
      result.transform,
    );
    const correctedCafeteria = gpsToLocallyCorrectedCampusPosition(
      cafeteriaEntrance,
      result.transform,
    );
    expect(correctedCafeteria?.x).toBeCloseTo(baseCafeteria?.x ?? 0, 8);
    expect(correctedCafeteria?.z).toBeCloseTo(baseCafeteria?.z ?? 0, 8);
  });

  it("detecta una configuración pendiente con ceros", () => {
    const result = calculateCalibrationTransform([
      {
        id: "placeholder-a",
        name: "Pendiente A",
        geo: { latitude: 0, longitude: 0 },
        map: { x: 0, z: 0 },
      },
      {
        id: "placeholder-b",
        name: "Pendiente B",
        geo: { latitude: 0, longitude: 0 },
        map: { x: 0, z: 0 },
      },
    ]);
    expect(result.status).toBe("pending");
    expect(result.transform).toBeNull();
  });

  it("detecta dos puntos GPS iguales", () => {
    const result = calculateCalibrationTransform([
      POINT_A,
      { ...POINT_B, geo: { ...POINT_A.geo } },
    ]);
    expect(result.status).toBe("invalid");
    expect(result.transform).toBeNull();
  });

  it("detecta dos puntos del modelo iguales", () => {
    const result = calculateCalibrationTransform([
      POINT_A,
      { ...POINT_B, map: { ...POINT_A.map } },
    ]);
    expect(result.status).toBe("invalid");
    expect(result.transform).toBeNull();
  });

  it("permite declarar inversión de ejes explícita", () => {
    const result = calculateCalibrationTransform(
      [POINT_A, POINT_B],
      { invertEast: true, invertNorth: false },
    );
    expect(result.status).toBe("valid");
    expect(result.transform?.axisInversion.invertEast).toBe(true);
  });

  it("impide NaN e Infinity en calibración y transformación", () => {
    const invalid = calculateCalibrationTransform([
      POINT_A,
      { ...POINT_B, map: { x: Number.NaN, z: Number.POSITIVE_INFINITY } },
    ]);
    expect(invalid.transform).toBeNull();

    const transform: CampusCalibrationTransform = {
      reference: POINT_A.geo,
      mapOrigin: POINT_A.map,
      scaleModelUnitsPerMeter: 1,
      rotationRadians: 0,
      axisInversion: { invertEast: false, invertNorth: false },
    };
    expect(
      localMetersToCampusPosition(
        { eastMeters: Number.NaN, northMeters: 0 },
        transform,
      ),
    ).toBeNull();
    expect(metersToModelUnits(Number.POSITIVE_INFINITY, 1)).toBeNull();
  });
});
