import { describe, expect, it } from "vitest";
import {
  getActiveGpsTransform,
  gpsToXZ,
  setActiveGpsTransform,
} from "./campus-transform";

describe("campus GPS transform", () => {
  it("ignores degenerate profiles from bad calibration points", () => {
    setActiveGpsTransform(null);
    const base = getActiveGpsTransform();

    setActiveGpsTransform({
      ref_lat: base.ref_lat,
      ref_lng: base.ref_lng,
      meters_lat: base.meters_lat,
      meters_lng: base.meters_lng,
      a_x: 10.125592532048117,
      b_x: 53.01876831002662,
      c_x: -9330.37086994198,
      a_z: 7.325742793521709,
      b_z: 38.358432718054786,
      c_z: -6877.901876635734,
    });

    expect(getActiveGpsTransform()).toEqual(base);
  });

  it("keeps Centro de Computo recent calibration near the campus model", () => {
    setActiveGpsTransform(null);
    const pos = gpsToXZ(17.07925176, -96.74443041);

    expect(pos.x).toBeCloseTo(64.73, 1);
    expect(pos.z).toBeCloseTo(-80.1, 1);
  });
});
