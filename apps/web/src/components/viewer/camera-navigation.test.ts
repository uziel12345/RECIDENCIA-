import { describe, expect, it } from "vitest";
import {
  DESKTOP_MAX_CAMERA_DISTANCE,
  getClampedZoomDistance,
  isSameBuildingFocus,
  MOBILE_MAX_CAMERA_DISTANCE,
  type BuildingFocusSnapshot,
} from "./camera-navigation";

describe("camera navigation", () => {
  it("acerca y aleja dentro de los límites", () => {
    expect(
      getClampedZoomDistance(100, -1, 20, DESKTOP_MAX_CAMERA_DISTANCE),
    ).toBeCloseTo(82);
    expect(
      getClampedZoomDistance(100, 1, 20, DESKTOP_MAX_CAMERA_DISTANCE),
    ).toBeCloseTo(118);
  });

  it("llega al límite en vez de ignorar el último gesto", () => {
    expect(
      getClampedZoomDistance(22, -1, 20, DESKTOP_MAX_CAMERA_DISTANCE),
    ).toBe(20);
    expect(
      getClampedZoomDistance(275, 1, 20, DESKTOP_MAX_CAMERA_DISTANCE),
    ).toBe(DESKTOP_MAX_CAMERA_DISTANCE);
    expect(
      getClampedZoomDistance(225, 1, 18, MOBILE_MAX_CAMERA_DISTANCE),
    ).toBe(MOBILE_MAX_CAMERA_DISTANCE);
  });

  it("tolera límites invertidos o una distancia no válida", () => {
    expect(
      getClampedZoomDistance(
        Number.NaN,
        -1,
        DESKTOP_MAX_CAMERA_DISTANCE,
        20,
      ),
    ).toBe(20);
  });

  it("reenfoca si el autocentrado del campus cambia después de seleccionar", () => {
    const previous: BuildingFocusSnapshot = {
      buildingId: "aud-lic",
      x: -47,
      z: 142,
      campusX: 0,
      campusZ: 0,
    };

    expect(isSameBuildingFocus(previous, {
      ...previous,
      campusX: 100.47,
      campusZ: 434.3,
    })).toBe(false);
  });

  it("reenfoca cuando la posición exacta del GLB reemplaza la de la base de datos", () => {
    const previous: BuildingFocusSnapshot = {
      buildingId: "aud-lic",
      x: -47,
      z: 142,
      campusX: 100.47,
      campusZ: 434.3,
    };

    expect(isSameBuildingFocus(previous, {
      ...previous,
      x: 361.92,
      z: -27.2,
    })).toBe(false);
  });

  it("no repite el enfoque si edificio, posición y centro siguen iguales", () => {
    const snapshot: BuildingFocusSnapshot = {
      buildingId: "aud-lic",
      x: 361.92,
      z: -27.2,
      campusX: 100.47,
      campusZ: 434.3,
    };

    expect(isSameBuildingFocus(snapshot, { ...snapshot })).toBe(true);
  });
});
