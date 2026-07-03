/**
 * Affine transform between real-world GPS coordinates and the campus 3D model space.
 *
 * To recalibrate: stand at a known building, open the calibration panel, select
 * the building and click "Calibrar". The offset is saved in localStorage and
 * applied automatically on every subsequent GPS → 3D conversion.
 *
 * Full recalibration (rotation fix) requires ≥3 anchor points spread across campus.
 */

const REF_LAT = 17.07761201319465;
const REF_LNG = -96.74416660753468;

// Meters per degree at ~17° N latitude
const METERS_PER_LAT = 111320;
const METERS_PER_LNG = 106411.66838807071; // 111320 * cos(17°)

// Affine matrix:  [x]   [A_X  B_X] [e_m]   [C_X]
//                 [z] = [A_Z  B_Z]·[n_m] + [C_Z]
// where e_m = easting metres east of REF_LNG, n_m = northing metres north of REF_LAT
const A_X = 0.612750409;
const B_X = 0.418012270;
const C_X = 5.624167932;
const A_Z = 0.306232943;
const B_Z = -0.562846840;
const C_Z = 31.232357195;

const MIN_AFFINE_DETERMINANT = 0.05;
const MAX_AFFINE_LINEAR_COEFFICIENT = 3;
const MAX_AFFINE_TRANSLATION = 500;

export type GpsTransformProfile = {
  ref_lat: number;
  ref_lng: number;
  meters_lat: number;
  meters_lng: number;
  a_x: number;
  b_x: number;
  c_x: number;
  a_z: number;
  b_z: number;
  c_z: number;
};

const BASE_TRANSFORM: GpsTransformProfile = {
  ref_lat: REF_LAT,
  ref_lng: REF_LNG,
  meters_lat: METERS_PER_LAT,
  meters_lng: METERS_PER_LNG,
  a_x: A_X,
  b_x: B_X,
  c_x: C_X,
  a_z: A_Z,
  b_z: B_Z,
  c_z: C_Z,
};

let activeTransform: GpsTransformProfile = BASE_TRANSFORM;

function determinant(profile = activeTransform): number {
  return profile.a_x * profile.b_z - profile.b_x * profile.a_z;
}

function isUsableTransform(profile: GpsTransformProfile): boolean {
  return (
    Number.isFinite(profile.ref_lat) &&
    Number.isFinite(profile.ref_lng) &&
    Number.isFinite(profile.meters_lat) &&
    Number.isFinite(profile.meters_lng) &&
    Number.isFinite(profile.a_x) &&
    Number.isFinite(profile.b_x) &&
    Number.isFinite(profile.c_x) &&
    Number.isFinite(profile.a_z) &&
    Number.isFinite(profile.b_z) &&
    Number.isFinite(profile.c_z) &&
    Math.abs(determinant(profile)) >= MIN_AFFINE_DETERMINANT &&
    Math.abs(profile.a_x) <= MAX_AFFINE_LINEAR_COEFFICIENT &&
    Math.abs(profile.b_x) <= MAX_AFFINE_LINEAR_COEFFICIENT &&
    Math.abs(profile.a_z) <= MAX_AFFINE_LINEAR_COEFFICIENT &&
    Math.abs(profile.b_z) <= MAX_AFFINE_LINEAR_COEFFICIENT &&
    Math.abs(profile.c_x) <= MAX_AFFINE_TRANSLATION &&
    Math.abs(profile.c_z) <= MAX_AFFINE_TRANSLATION
  );
}

export function getActiveGpsTransform(): GpsTransformProfile {
  return activeTransform;
}

export function setActiveGpsTransform(profile: GpsTransformProfile | null): void {
  if (!profile) {
    activeTransform = BASE_TRANSFORM;
    return;
  }

  if (!isUsableTransform(profile)) {
    return;
  }

  activeTransform = profile;
}

// ── Calibration offset (translation correction) ─────────────────────────────

const CALIB_KEY = "ito-campus-calib-v2";

let _dx = 0;
let _dz = 0;

// Load persisted offset once at module init (runs in browser only)
try {
  const raw = localStorage.getItem(CALIB_KEY);
  if (raw) {
    const p = JSON.parse(raw) as { dx: number; dz: number };
    if (Number.isFinite(p.dx) && Number.isFinite(p.dz)) {
      _dx = p.dx;
      _dz = p.dz;
    }
  }
} catch {}

export function getCalibOffset(): { dx: number; dz: number } {
  return { dx: _dx, dz: _dz };
}

export function saveCalibOffset(dx: number, dz: number): void {
  _dx = dx;
  _dz = dz;
  try { localStorage.setItem(CALIB_KEY, JSON.stringify({ dx, dz })); } catch {}
}

export function clearCalibOffset(): void {
  _dx = 0;
  _dz = 0;
  try { localStorage.removeItem(CALIB_KEY); } catch {}
}

// ── Transform functions ──────────────────────────────────────────────────────

export function gpsToEastingNorthing(latitude: number, longitude: number): { e: number; n: number } {
  return {
    e: (longitude - activeTransform.ref_lng) * activeTransform.meters_lng,
    n: (latitude - activeTransform.ref_lat) * activeTransform.meters_lat,
  };
}

function applyAffine(latitude: number, longitude: number): { x: number; z: number } {
  const { e, n } = gpsToEastingNorthing(latitude, longitude);
  return {
    x: activeTransform.a_x * e + activeTransform.b_x * n + activeTransform.c_x,
    z: activeTransform.a_z * e + activeTransform.b_z * n + activeTransform.c_z,
  };
}

/**
 * GPS → campus 3D local coordinates (includes calibration offset).
 * Use this to position the user marker on the map.
 */
export function gpsToXZ(latitude: number, longitude: number): { x: number; z: number } {
  const raw = applyAffine(latitude, longitude);
  return { x: raw.x + _dx, z: raw.z + _dz };
}

/**
 * GPS → 3D without calibration offset.
 * Used internally by the calibration panel to compute the correction needed.
 */
export function gpsToXZUncalibrated(latitude: number, longitude: number): { x: number; z: number } {
  return applyAffine(latitude, longitude);
}

/**
 * Campus 3D local coordinates → GPS.
 * Use this to store GPS for a building given its model position.
 */
export function xzToGps(x: number, z: number): { latitude: number; longitude: number } {
  const det = determinant();
  const px = x - activeTransform.c_x;
  const pz = z - activeTransform.c_z;
  const e = (px * activeTransform.b_z - activeTransform.b_x * pz) / det;
  const n = (activeTransform.a_x * pz - px * activeTransform.a_z) / det;
  return {
    latitude: activeTransform.ref_lat + n / activeTransform.meters_lat,
    longitude: activeTransform.ref_lng + e / activeTransform.meters_lng,
  };
}

// ── Recalibración completa (multi-punto) ────────────────────────────────────
//
// La corrección dx/dz de arriba solo traslada el punto: sirve para un edificio
// a la vez, pero no corrige rotación/escala, y no sirve lejos de donde se
// calibró. Para recalcular A_X..C_Z de raíz hacen falta ≥3 puntos GPS reales
// (no derivados de xzToGps) repartidos por el campus. Estos puntos se
// recolectan aquí durante una caminata y se ajustan por mínimos cuadrados.

export type ReferencePoint = {
  buildingId: string;
  buildingName: string;
  buildingCode: string;
  modelX: number;
  modelZ: number;
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

const REF_POINTS_KEY = "ito-campus-calib-points-v1";

export function getReferencePoints(): ReferencePoint[] {
  try {
    const raw = localStorage.getItem(REF_POINTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as ReferencePoint[]) : [];
  } catch {
    return [];
  }
}

export function saveReferencePoints(points: ReferencePoint[]): void {
  try {
    localStorage.setItem(REF_POINTS_KEY, JSON.stringify(points));
  } catch {
    // localStorage no disponible (modo privado, cuota excedida, etc.)
  }
}

export type FittedAffine = {
  A_X: number;
  B_X: number;
  C_X: number;
  A_Z: number;
  B_Z: number;
  C_Z: number;
};

function solve3x3(m: number[][], b: number[]): number[] | null {
  const det3 = (mm: number[][]): number =>
    mm[0][0] * (mm[1][1] * mm[2][2] - mm[1][2] * mm[2][1]) -
    mm[0][1] * (mm[1][0] * mm[2][2] - mm[1][2] * mm[2][0]) +
    mm[0][2] * (mm[1][0] * mm[2][1] - mm[1][1] * mm[2][0]);

  const D = det3(m);
  if (Math.abs(D) < 1e-9) return null;

  const withCol = (col: number, vec: number[]): number[][] =>
    m.map((row, i) => row.map((v, j) => (j === col ? vec[i] : v)));

  return [det3(withCol(0, b)) / D, det3(withCol(1, b)) / D, det3(withCol(2, b)) / D];
}

/**
 * Ajusta A_X..C_Z por mínimos cuadrados a partir de puntos (GPS real, x/z del
 * edificio). Requiere ≥3 puntos no colineales; con más puntos el ajuste
 * promedia el ruido del GPS en vez de propagarlo directo a la fórmula.
 */
export function fitAffineFromPoints(points: ReferencePoint[]): FittedAffine | null {
  if (points.length < 3) return null;

  const rows = points.map((p) => {
    const { e, n } = gpsToEastingNorthing(p.latitude, p.longitude);
    return { e, n, x: p.modelX, z: p.modelZ };
  });

  let Se2 = 0, Sen = 0, Se = 0, Sn2 = 0, Sn = 0;
  let Sex = 0, Snx = 0, Sx = 0, Sez = 0, Snz = 0, Sz = 0;

  for (const r of rows) {
    Se2 += r.e * r.e; Sen += r.e * r.n; Se += r.e;
    Sn2 += r.n * r.n; Sn += r.n;
    Sex += r.e * r.x; Snx += r.n * r.x; Sx += r.x;
    Sez += r.e * r.z; Snz += r.n * r.z; Sz += r.z;
  }

  const M = [
    [Se2, Sen, Se],
    [Sen, Sn2, Sn],
    [Se, Sn, rows.length],
  ];

  const solX = solve3x3(M, [Sex, Snx, Sx]);
  const solZ = solve3x3(M, [Sez, Snz, Sz]);
  if (!solX || !solZ) return null;

  const fit = {
    A_X: solX[0], B_X: solX[1], C_X: solX[2],
    A_Z: solZ[0], B_Z: solZ[1], C_Z: solZ[2],
  };
  return isUsableTransform({
    ref_lat: activeTransform.ref_lat,
    ref_lng: activeTransform.ref_lng,
    meters_lat: activeTransform.meters_lat,
    meters_lng: activeTransform.meters_lng,
    a_x: fit.A_X,
    b_x: fit.B_X,
    c_x: fit.C_X,
    a_z: fit.A_Z,
    b_z: fit.B_Z,
    c_z: fit.C_Z,
  }) ? fit : null;
}

/** Error residual (metros) de cada punto contra la fórmula ajustada. */
export function affineResidualsMeters(points: ReferencePoint[], fit: FittedAffine): number[] {
  return points.map((p) => {
    const { e, n } = gpsToEastingNorthing(p.latitude, p.longitude);
    const x2 = fit.A_X * e + fit.B_X * n + fit.C_X;
    const z2 = fit.A_Z * e + fit.B_Z * n + fit.C_Z;
    return Math.hypot(x2 - p.modelX, z2 - p.modelZ);
  });
}
